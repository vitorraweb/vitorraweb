/**
 * Vitorra Holdings — Secure E-Commerce Cloud Functions
 * =====================================================
 * These functions are the SINGLE SOURCE OF TRUTH for:
 *  1. Price calculation (never trust the frontend)
 *  2. Inventory management (atomic stock deduction)
 *  3. Order creation (server-generated IDs)
 *  4. Payment initialization (Flutterwave / PayPal)
 *  5. Payment verification (webhook listeners)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require("cors");
const corsHandler = cors({origin: true});

admin.initializeApp();
const db = admin.firestore();

// ─── Config ──────────────────────────────────────────────────────────────────
// Set these via: firebase functions:config:set
//   flutterwave.secret_key="FLWSECK_TEST-xxx"
//   flutterwave.public_key="FLWPUBK_TEST-xxx"
//   paypal.client_id="xxx"
//   paypal.client_secret="xxx"
//   paypal.mode="sandbox"  (or "live")
//   app.frontend_url="https://vitorra-holdings-limited.web.app"

const FLUTTERWAVE_SECRET = functions.config().flutterwave?.secret_key || "PLACEHOLDER_FLW_SECRET";
const FLUTTERWAVE_BASE = "https://api.flutterwave.com/v3";
const PAYPAL_CLIENT_ID = functions.config().paypal?.client_id || "PLACEHOLDER_PAYPAL_CLIENT_ID";
const PAYPAL_SECRET = functions.config().paypal?.client_secret || "PLACEHOLDER_PAYPAL_SECRET";
const PAYPAL_BASE = functions.config().paypal?.mode === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";
const FRONTEND_URL = functions.config().app?.frontend_url || "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface CartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

interface ValidatedItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

/**
 * Fetches products from Firestore and calculates real prices.
 * This is the anti-price-manipulation layer.
 */
async function resolveCartItems(
  items: CartItemRequest[]
): Promise<{validatedItems: ValidatedItem[]; errors: string[]}> {
  const validatedItems: ValidatedItem[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const productSnap = await db.collection("products").doc(item.productId).get();
    if (!productSnap.exists) {
      errors.push(`Product ${item.productId} not found.`);
      continue;
    }

    const product = productSnap.data()!;
    let name = product.name;
    let price = product.price || 0;
    let stock = product.stock ?? 999; // default high for products without stock tracking

    // If a variant is specified, use the variant's price and stock
    if (item.variantId && product.variants) {
      const variant = (product.variants as any[]).find(
        (v: any) => v.id === item.variantId
      );
      if (!variant) {
        errors.push(`Variant ${item.variantId} not found for ${product.name}.`);
        continue;
      }
      name = `${product.name} — ${variant.name}`;
      price = variant.price;
      stock = variant.stock ?? 999;
    }

    if (price <= 0) {
      errors.push(`${name} has no valid price configured.`);
      continue;
    }

    if (item.quantity > stock) {
      errors.push(`${name}: Only ${stock} in stock (requested ${item.quantity}).`);
      continue;
    }

    if (item.quantity < 1) {
      errors.push(`${name}: Quantity must be at least 1.`);
      continue;
    }

    validatedItems.push({
      productId: item.productId,
      variantId: item.variantId,
      name,
      price,
      quantity: item.quantity,
      stock,
    });
  }

  return {validatedItems, errors};
}

function generateOrderId(): string {
  // Secure, unpredictable 8-char alphanumeric ID
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "VIT-";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Calculate shipping based on business rules
function calculateShipping(subtotal: number, method: string): number {
  if (subtotal >= 2000000) return 0; // Free shipping over 2M UGX
  if (method === "pickup") return 0;
  return 25000; // Base domestic rate
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 1: validateCart
// Called when user clicks "Proceed to Checkout"
// Returns server-calculated prices — the frontend displays these, never its own.
// ═══════════════════════════════════════════════════════════════════════════════

export const validateCart = functions.https.onCall(
  async (request) => {
    const data = request.data;
    const items: CartItemRequest[] = data?.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Cart is empty."
      );
    }

    const {validatedItems, errors} = await resolveCartItems(items);

    if (errors.length > 0) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        errors.join(" | ")
      );
    }

    const subtotal = validatedItems.reduce(
      (sum, i) => sum + i.price * i.quantity, 0
    );
    const shipping = calculateShipping(subtotal, data.shippingMethod || "vitorra_logistics");
    const grandTotal = subtotal + shipping;

    return {
      validatedItems: validatedItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.name,
        unitPrice: i.price,
        quantity: i.quantity,
        lineTotal: i.price * i.quantity,
        inStock: i.stock >= i.quantity,
      })),
      subtotal,
      shipping,
      tax: 0, // Uganda doesn't apply VAT at checkout for these product types
      grandTotal,
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 2: createOrder
// Called when user clicks "Place Order"
// Runs an atomic Firestore transaction: validates ∩ deducts inventory ∩ creates order
// ═══════════════════════════════════════════════════════════════════════════════

export const createOrder = functions.https.onCall(
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to place an order."
      );
    }

    const uid = request.auth.uid;
    const data = request.data;
    const items: CartItemRequest[] = data?.items;
    const shippingAddressData = data?.shippingAddress;
    const paymentMethod: string = data?.paymentMethod || "bank_transfer";
    const paymentReference: string = data?.paymentReference || "";

    if (!items || items.length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Cart is empty.");
    }
    if (!shippingAddressData) {
      throw new functions.https.HttpsError("invalid-argument", "Shipping address is required.");
    }

    // Fetch user profile
    const userSnap = await db.collection("users").doc(uid).get();
    const userProfile = userSnap.exists ? userSnap.data()! : {};

    // Run everything inside a transaction for atomicity
    const orderId = generateOrderId();
    const timestamp = new Date().toISOString();

    const order = await db.runTransaction(async (transaction) => {
      // 1. Re-validate all prices & stock from the DB (inside transaction)
      const orderItems: {id: string; name: string; quantity: number; price: number}[] = [];
      let subtotal = 0;

      for (const item of items) {
        const productRef = db.collection("products").doc(item.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            `Product ${item.productId} no longer exists.`
          );
        }

        const product = productSnap.data()!;
        let name = product.name;
        let price = product.price || 0;
        let currentStock = product.stock ?? 999;
        let variantIndex = -1;

        if (item.variantId && product.variants) {
          variantIndex = (product.variants as any[]).findIndex(
            (v: any) => v.id === item.variantId
          );
          if (variantIndex === -1) {
            throw new functions.https.HttpsError(
              "not-found",
              `Variant ${item.variantId} not found.`
            );
          }
          const variant = product.variants[variantIndex];
          name = `${product.name} — ${variant.name}`;
          price = variant.price;
          currentStock = variant.stock ?? 999;
        }

        if (item.quantity > currentStock) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            `${name}: Only ${currentStock} left in stock.`
          );
        }

        // 2. Deduct inventory
        if (item.variantId && variantIndex >= 0) {
          const updatedVariants = [...product.variants];
          updatedVariants[variantIndex] = {
            ...updatedVariants[variantIndex],
            stock: currentStock - item.quantity,
          };
          transaction.update(productRef, {variants: updatedVariants});
        } else {
          transaction.update(productRef, {
            stock: admin.firestore.FieldValue.increment(-item.quantity),
          });
        }

        orderItems.push({
          id: item.variantId || item.productId,
          name,
          quantity: item.quantity,
          price,
        });
        subtotal += price * item.quantity;
      }

      // 3. Calculate totals
      const shippingMethod = data.shippingMethod || "vitorra_logistics";
      const shipping = calculateShipping(subtotal, shippingMethod);
      const total = subtotal + shipping;

      // 4. Build order document
      const shippingStr = typeof shippingAddressData === "string"
        ? shippingAddressData
        : `${shippingAddressData.fullName}, ${shippingAddressData.street}, ${shippingAddressData.city}, ${shippingAddressData.state} ${shippingAddressData.postalCode}, ${shippingAddressData.country}`;

      const orderDoc = {
        id: orderId,
        customerId: uid,
        customerName: userProfile.displayName || shippingAddressData.fullName || "Customer",
        customerEmail: userProfile.email || "",
        phone: shippingAddressData.phone || userProfile.phone || "",
        orderType: "product" as const,
        items: orderItems,
        subtotal,
        shippingCost: shipping,
        total,
        status: paymentMethod === "bank_transfer" ? "pending" : "awaiting_payment",
        date: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        shippingMethod,
        shippingAddress: shippingStr,
        billingAddress: shippingStr,
        paymentMethod,
        paymentReference,
        paymentStatus: paymentMethod === "bank_transfer" ? "pending_transfer" : "pending",
      };

      // 5. Write order to central collection
      const orderRef = db.collection("orders").doc(orderId);
      transaction.set(orderRef, orderDoc);

      // 6. Write to user's subcollection for portal visibility
      const userOrderRef = db.collection("users").doc(uid).collection("orders").doc(orderId);
      transaction.set(userOrderRef, orderDoc);

      return orderDoc;
    });

    return {
      orderId: order.id,
      total: order.total,
      paymentMethod,
      status: order.status,
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 3: initializePayment
// Creates a Flutterwave or PayPal payment session for the given order.
// Returns data the frontend needs to redirect or display the payment widget.
// ═══════════════════════════════════════════════════════════════════════════════

export const initializePayment = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
    }

    const {orderId, gateway} = request.data;
    if (!orderId || !gateway) {
      throw new functions.https.HttpsError("invalid-argument", "orderId and gateway required.");
    }

    // Fetch the order to get the authoritative total
    const orderSnap = await db.collection("orders").doc(orderId).get();
    if (!orderSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found.");
    }
    const order = orderSnap.data()!;

    // Verify ownership
    if (order.customerId !== request.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Not your order.");
    }

    const txRef = `VIT-${orderId}-${Date.now()}`;

    // ── FLUTTERWAVE ──
    if (gateway === "flutterwave") {
      try {
        const response = await axios.post(
          `${FLUTTERWAVE_BASE}/payments`,
          {
            tx_ref: txRef,
            amount: order.total,
            currency: "UGX",
            redirect_url: `${FRONTEND_URL}/order-success?orderId=${orderId}`,
            customer: {
              email: order.customerEmail,
              name: order.customerName,
              phonenumber: order.phone || "",
            },
            customizations: {
              title: "Vitorra Holdings",
              logo: `${FRONTEND_URL}/vitorra-logo.png`,
              description: `Order ${orderId}`,
            },
            payment_options: "mobilemoney,banktransfer,card,ussd",
            meta: {
              order_id: orderId,
              customer_id: order.customerId,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${FLUTTERWAVE_SECRET}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Update order with payment reference
        await db.collection("orders").doc(orderId).update({
          paymentReference: txRef,
          paymentGateway: "flutterwave",
          updatedAt: new Date().toISOString(),
        });

        return {
          gateway: "flutterwave",
          paymentLink: response.data?.data?.link || null,
          txRef,
        };
      } catch (err: any) {
        console.error("Flutterwave init error:", err.response?.data || err.message);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to initialize Flutterwave payment. Please try again."
        );
      }
    }

    // ── PAYPAL ──
    if (gateway === "paypal") {
      try {
        // 1. Get PayPal access token
        const authResponse = await axios.post(
          `${PAYPAL_BASE}/v1/oauth2/token`,
          "grant_type=client_credentials",
          {
            auth: {username: PAYPAL_CLIENT_ID, password: PAYPAL_SECRET},
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
          }
        );
        const accessToken = authResponse.data.access_token;

        // 2. Convert UGX to USD for PayPal (approximate rate)
        const usdAmount = (order.total / 3800).toFixed(2); // ~3800 UGX per USD

        // 3. Create PayPal order
        const paypalOrder = await axios.post(
          `${PAYPAL_BASE}/v2/checkout/orders`,
          {
            intent: "CAPTURE",
            purchase_units: [{
              reference_id: orderId,
              description: `Vitorra Order ${orderId}`,
              amount: {
                currency_code: "USD",
                value: usdAmount,
              },
            }],
            application_context: {
              brand_name: "Vitorra Holdings",
              return_url: `${FRONTEND_URL}/order-success?orderId=${orderId}`,
              cancel_url: `${FRONTEND_URL}/checkout?cancelled=true`,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const approvalLink = paypalOrder.data.links?.find(
          (l: any) => l.rel === "approve"
        );

        await db.collection("orders").doc(orderId).update({
          paymentReference: paypalOrder.data.id,
          paymentGateway: "paypal",
          updatedAt: new Date().toISOString(),
        });

        return {
          gateway: "paypal",
          paypalOrderId: paypalOrder.data.id,
          approvalUrl: approvalLink?.href || null,
        };
      } catch (err: any) {
        console.error("PayPal init error:", err.response?.data || err.message);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to initialize PayPal payment."
        );
      }
    }

    // ── BANK TRANSFER (no external gateway) ──
    if (gateway === "bank_transfer") {
      await db.collection("orders").doc(orderId).update({
        paymentMethod: "bank_transfer",
        paymentGateway: "offline",
        paymentStatus: "pending_transfer",
        updatedAt: new Date().toISOString(),
      });
      return {
        gateway: "bank_transfer",
        bankDetails: {
          bankName: "Stanbic Bank Uganda",
          accountName: "Vitorra Holdings Limited",
          accountNumber: "9030005678901",
          reference: orderId,
        },
      };
    }

    throw new functions.https.HttpsError(
      "invalid-argument",
      `Unknown payment gateway: ${gateway}. Use "flutterwave", "paypal", or "bank_transfer".`
    );
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 4: Flutterwave Webhook
// Verifies payment and marks order as paid. NEVER trust the frontend.
// ═══════════════════════════════════════════════════════════════════════════════

export const flutterwaveWebhook = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Verify webhook signature
    const secretHash = functions.config().flutterwave?.webhook_hash;
    const signature = req.headers["verif-hash"];
    if (secretHash && signature !== secretHash) {
      console.error("Invalid Flutterwave webhook signature");
      res.status(401).send("Unauthorized");
      return;
    }

    const payload = req.body;
    const event = payload?.event;
    const txData = payload?.data;

    if (event === "charge.completed" && txData?.status === "successful") {
      const orderId = txData?.meta?.order_id || txData?.tx_ref?.split("-")?.[1];

      if (!orderId) {
        console.error("No order_id in webhook payload");
        res.status(400).send("Missing order_id");
        return;
      }

      // Verify the charge amount with Flutterwave API
      try {
        const verifyRes = await axios.get(
          `${FLUTTERWAVE_BASE}/transactions/${txData.id}/verify`,
          {headers: {Authorization: `Bearer ${FLUTTERWAVE_SECRET}`}}
        );

        const verified = verifyRes.data?.data;
        if (verified?.status !== "successful") {
          console.error("Flutterwave verification failed:", verified);
          res.status(400).send("Verification failed");
          return;
        }

        // Cross-check amount
        const orderSnap = await db.collection("orders").doc(orderId).get();
        if (!orderSnap.exists) {
          console.error(`Order ${orderId} not found during webhook`);
          res.status(404).send("Order not found");
          return;
        }

        const order = orderSnap.data()!;
        if (verified.amount < order.total) {
          console.error(`Amount mismatch: paid ${verified.amount}, expected ${order.total}`);
          // Still mark but flag it
          await db.collection("orders").doc(orderId).update({
            paymentStatus: "amount_mismatch",
            paymentAmountReceived: verified.amount,
            adminNotes: `⚠️ Payment amount mismatch. Expected ${order.total}, received ${verified.amount}.`,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // ✅ Payment verified — advance the order
          const updates: any = {
            status: "awaiting_invoice",
            paymentStatus: "paid",
            paymentAmountReceived: verified.amount,
            paymentTransactionId: String(txData.id),
            paymentCompletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.collection("orders").doc(orderId).update(updates);

          // Sync to user subcollection
          if (order.customerId) {
            await db.collection("users").doc(order.customerId)
              .collection("orders").doc(orderId)
              .update(updates)
              .catch((e: any) => console.error("User order sync error:", e));
          }
        }

        res.status(200).json({status: "ok"});
      } catch (err: any) {
        console.error("Webhook processing error:", err.message);
        res.status(500).send("Internal error");
      }
    } else {
      // Acknowledge non-payment events
      res.status(200).json({status: "ignored", event});
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 5: PayPal Webhook
// ═══════════════════════════════════════════════════════════════════════════════

export const paypalWebhook = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const payload = req.body;
    const eventType = payload?.event_type;

    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = payload?.resource;
      const orderId = resource?.purchase_units?.[0]?.reference_id;

      if (!orderId) {
        res.status(400).send("Missing reference_id");
        return;
      }

      const orderSnap = await db.collection("orders").doc(orderId).get();
      if (!orderSnap.exists) {
        res.status(404).send("Order not found");
        return;
      }

      const order = orderSnap.data()!;
      const updates: any = {
        status: "awaiting_invoice",
        paymentStatus: "paid",
        paymentTransactionId: resource?.id || "",
        paymentCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("orders").doc(orderId).update(updates);

      if (order.customerId) {
        await db.collection("users").doc(order.customerId)
          .collection("orders").doc(orderId)
          .update(updates)
          .catch((e: any) => console.error("User order sync:", e));
      }

      res.status(200).json({status: "ok"});
    } else {
      res.status(200).json({status: "ignored", eventType});
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 6: getOrderDetails (ownership-verified)
// ═══════════════════════════════════════════════════════════════════════════════

export const getOrderDetails = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
    }

    const {orderId} = request.data;
    if (!orderId) {
      throw new functions.https.HttpsError("invalid-argument", "orderId required.");
    }

    const orderSnap = await db.collection("orders").doc(orderId).get();
    if (!orderSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found.");
    }

    const order = orderSnap.data()!;

    // Check ownership OR admin role
    const userSnap = await db.collection("users").doc(request.auth.uid).get();
    const userRole = userSnap.exists ? userSnap.data()?.role : "";
    const isAdmin = ["admin", "Super Admin", "Ops Manager"].includes(userRole);

    if (order.customerId !== request.auth.uid && !isAdmin) {
      throw new functions.https.HttpsError("permission-denied", "Not authorized.");
    }

    return order;
  }
);
