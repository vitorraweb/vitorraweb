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
import * as nodemailer from "nodemailer";

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
const FRONTEND_URL = process.env.FRONTEND_URL || "https://vitorra.org";

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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 7: inviteTeamMember
// Creates a Firebase Auth user + Firestore profile with the specified admin role.
// Only callable by Super Admin.
// ═══════════════════════════════════════════════════════════════════════════════

export const inviteTeamMember = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
    }

    // Verify caller is Super Admin
    const callerSnap = await db.collection("users").doc(request.auth.uid).get();
    const callerRole = callerSnap.exists ? callerSnap.data()?.role : "";
    if (!["admin", "Super Admin"].includes(callerRole)) {
      throw new functions.https.HttpsError("permission-denied", "Only Super Admins can invite team members.");
    }

    const {email, displayName, role, tempPassword} = request.data;
    if (!email || !displayName || !role) {
      throw new functions.https.HttpsError("invalid-argument", "email, displayName, and role are required.");
    }

    const validRoles = ["Super Admin", "Ops Manager", "Viewer", "admin"];
    if (!validRoles.includes(role)) {
      throw new functions.https.HttpsError("invalid-argument", `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`);
    }

    const password = tempPassword || `Vitorra_${Math.random().toString(36).slice(2, 10)}`;

    try {
      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email,
        displayName,
        password,
        emailVerified: false,
      });

      // Create Firestore profile with the admin role
      const profile = {
        uid: userRecord.uid,
        displayName,
        email,
        phone: "",
        photoURL: "",
        company: {name: "Vitorra Holdings Limited", registrationNo: "", taxId: "", website: ""},
        addresses: [],
        preferences: {
          language: "en",
          currency: "UGX",
          emailNotifications: {orderUpdates: true, promotions: false, newsletter: false},
        },
        role,
        accountType: "business",
        status: "active",
        emailVerified: false,
        providers: ["password"],
        createdAt: new Date().toISOString(),
        lastLoginAt: "",
        invitedBy: request.auth.uid,
      };

      await db.collection("users").doc(userRecord.uid).set(profile);

      // Also sync to settings team list
      const settingsSnap = await db.collection("system").doc("settings").get();
      if (settingsSnap.exists) {
        const settings = settingsSnap.data()!;
        const team = settings.general?.team || [];
        team.push({
          id: userRecord.uid,
          name: displayName,
          email,
          role,
          status: "active",
        });
        await db.collection("system").doc("settings").update({"general.team": team});
      }

      return {
        uid: userRecord.uid,
        email,
        displayName,
        role,
        tempPassword: password,
      };
    } catch (err: any) {
      if (err.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError("already-exists", "A user with this email already exists.");
      }
      console.error("inviteTeamMember error:", err);
      throw new functions.https.HttpsError("internal", err.message || "Failed to create team member.");
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 8: updateTeamMemberRole
// Updates a team member's role in both Firestore profile and settings team list.
// Only callable by Super Admin.
// ═══════════════════════════════════════════════════════════════════════════════

export const updateTeamMemberRole = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
    }

    const callerSnap = await db.collection("users").doc(request.auth.uid).get();
    const callerRole = callerSnap.exists ? callerSnap.data()?.role : "";
    if (!["admin", "Super Admin"].includes(callerRole)) {
      throw new functions.https.HttpsError("permission-denied", "Only Super Admins can change roles.");
    }

    const {targetUid, newRole} = request.data;
    if (!targetUid || !newRole) {
      throw new functions.https.HttpsError("invalid-argument", "targetUid and newRole required.");
    }

    // Prevent demoting yourself
    if (targetUid === request.auth.uid) {
      throw new functions.https.HttpsError("failed-precondition", "You cannot change your own role.");
    }

    const validRoles = ["Super Admin", "Ops Manager", "Viewer", "admin"];
    if (!validRoles.includes(newRole)) {
      throw new functions.https.HttpsError("invalid-argument", `Invalid role: ${newRole}`);
    }

    // Update Firestore user profile
    await db.collection("users").doc(targetUid).update({role: newRole});

    // Sync to settings team list
    const settingsSnap = await db.collection("system").doc("settings").get();
    if (settingsSnap.exists) {
      const settings = settingsSnap.data()!;
      const team = (settings.general?.team || []).map((m: any) =>
        m.id === targetUid ? {...m, role: newRole} : m
      );
      await db.collection("system").doc("settings").update({"general.team": team});
    }

    return {uid: targetUid, role: newRole};
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION 9: removeTeamMember
// Disables a team member's Firebase Auth account and removes from settings.
// Only callable by Super Admin.
// ═══════════════════════════════════════════════════════════════════════════════

export const removeTeamMember = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
    }

    const callerSnap = await db.collection("users").doc(request.auth.uid).get();
    const callerRole = callerSnap.exists ? callerSnap.data()?.role : "";
    if (!["admin", "Super Admin"].includes(callerRole)) {
      throw new functions.https.HttpsError("permission-denied", "Only Super Admins can remove members.");
    }

    const {targetUid} = request.data;
    if (!targetUid) {
      throw new functions.https.HttpsError("invalid-argument", "targetUid required.");
    }

    if (targetUid === request.auth.uid) {
      throw new functions.https.HttpsError("failed-precondition", "You cannot remove yourself.");
    }

    // Disable the auth account (don't delete — preserve data)
    await admin.auth().updateUser(targetUid, {disabled: true});

    // Update Firestore profile
    await db.collection("users").doc(targetUid).update({status: "suspended", role: "Viewer"});

    // Remove from settings team list
    const settingsSnap = await db.collection("system").doc("settings").get();
    if (settingsSnap.exists) {
      const settings = settingsSnap.data()!;
      const team = (settings.general?.team || []).filter((m: any) => m.id !== targetUid);
      await db.collection("system").doc("settings").update({"general.team": team});
    }

    return {uid: targetUid, status: "disabled"};
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
// Configure via functions/.env file:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=your@gmail.com
//   SMTP_PASS=your_app_password
//   SMTP_FROM_NAME=Vitorra Holdings
//   ADMIN_EMAIL=support@vitorra.org
// ═══════════════════════════════════════════════════════════════════════════════

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "Vitorra Holdings";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "support@vitorra.org";

// Create reusable transporter
function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

// ─── Branded Email Template ──────────────────────────────────────────────────

function emailTemplate(content: {
  preheader?: string;
  headline: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}): string {
  // Vitorra brand palette
  const gold = "#D4A843";
  const goldDark = "#A6863B";
  const charcoal = "#1A1A1A";
  const warmWhite = "#FAFAF7";
  const textMuted = "#6B6560";
  const borderSoft = "#E8E3D8";
  // Logo must be served from the actual hosting domain (firebase), not vitorra.org
  const logoUrl = "https://vitorra-holdings-limited.web.app/images/vitorralogo.png";
  const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${content.headline}</title>
  ${content.preheader ? `<span style="display:none;font-size:1px;color:${warmWhite};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${content.preheader}</span>` : ""}
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .mobile-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-pad-sm { padding-left: 16px !important; padding-right: 16px !important; }
      .mobile-h1 { font-size: 22px !important; }
      .mobile-body { font-size: 14px !important; }
      .mobile-hide { display: none !important; }
      .mobile-full { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-logo { width: 36px !important; height: 36px !important; }
      .mobile-brand { font-size: 18px !important; }
      .mobile-stack td { display: block !important; width: 100% !important; text-align: left !important; padding-top: 4px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#EEEAE2;font-family:Georgia,'Times New Roman',serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EEEAE2;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td class="mobile-pad" style="padding:20px 28px;background:${charcoal};border-radius:12px 12px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:44px;">
                    <img src="${logoUrl}" alt="Vitorra" width="40" height="40" class="mobile-logo" style="display:block;border:0;border-radius:6px;" />
                  </td>
                  <td style="padding-left:12px;">
                    <span class="mobile-brand" style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:1.5px;font-family:${sans};">VITORRA</span>
                    <span style="display:block;font-size:9px;color:${gold};text-transform:uppercase;letter-spacing:2px;margin-top:1px;font-family:${sans};">Holdings Limited</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GOLD ACCENT LINE -->
          <tr>
            <td style="height:3px;background:${gold};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="mobile-pad" style="padding:32px 28px 24px;background:${warmWhite};">
              <h1 class="mobile-h1" style="margin:0 0 18px;font-size:24px;font-weight:700;color:${charcoal};line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
                ${content.headline}
              </h1>
              <div class="mobile-body" style="font-size:15px;line-height:1.8;color:${textMuted};font-family:${sans};">
                ${content.body}
              </div>
              ${content.ctaText && content.ctaUrl ? `
              <div style="margin:24px 0 8px;">
                <a href="${content.ctaUrl}" style="display:inline-block;padding:12px 28px;background:${gold};color:${charcoal};font-size:13px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.5px;font-family:${sans};">
                  ${content.ctaText}
                </a>
              </div>` : ""}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td class="mobile-pad" style="padding:0 28px;background:${warmWhite};">
              <div style="height:1px;background:${borderSoft};"></div>
            </td>
          </tr>

          <!-- FOOTER MESSAGE -->
          ${content.footer ? `
          <tr>
            <td class="mobile-pad" style="padding:16px 28px 0;background:${warmWhite};">
              <p style="margin:0;font-size:11px;color:#999;line-height:1.6;font-style:italic;font-family:${sans};">${content.footer}</p>
            </td>
          </tr>` : ""}

          <!-- FOOTER -->
          <tr>
            <td class="mobile-pad" style="padding:20px 28px 24px;background:${warmWhite};border-radius:0 0 12px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-top:12px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${textMuted};font-family:${sans};">Vitorra Holdings Limited</p>
                    <p style="margin:0 0 8px;font-size:11px;color:#999;line-height:1.5;font-family:${sans};">
                      Padre Pio House, Plot 32, Lumumba Avenue, Kampala, Uganda
                    </p>
                    <p style="margin:0;font-size:11px;line-height:1.8;font-family:${sans};">
                      <a href="mailto:vitorraholdingsltd@gmail.com" style="color:${goldDark};text-decoration:none;">vitorraholdingsltd@gmail.com</a><br>
                      <a href="tel:+256740026118" style="color:${goldDark};text-decoration:none;">+256 740 026 118</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;margin-top:10px;border-top:1px solid ${borderSoft};">
                    <p style="margin:0;font-size:10px;color:#BBB;font-family:${sans};">
                      &copy; ${new Date().getFullYear()} Vitorra Holdings Limited. All rights reserved.
                      &nbsp;&bull;&nbsp;
                      <a href="${FRONTEND_URL}" style="color:${goldDark};text-decoration:none;">vitorra.org</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Email Helper ───────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP not configured. Skipping email to:", to, "Subject:", subject);
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    return false;
  }
}

// Format UGX currency
function fmtUGX(n: number): string {
  return new Intl.NumberFormat("en-UG", {style: "currency", currency: "UGX", maximumFractionDigits: 0}).format(n);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 1: Contact Form Submission
// Fires when a customer submits the contact form.
// Sends:  (a) Admin notification with full inquiry details
//         (b) Customer auto-reply confirming receipt
// ═══════════════════════════════════════════════════════════════════════════════

export const onContactSubmission = functions.firestore
  .document("contactSubmissions/{docId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    const name = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Customer";
    const email = data.email || "";
    const subject = data.subject || "General Inquiry";
    const message = data.message || "";
    const phone = data.phone || "";

    // ── (a) ADMIN NOTIFICATION ──
    await sendEmail(
      ADMIN_EMAIL,
      `🔔 New Inquiry: ${subject}`,
      emailTemplate({
        preheader: `New contact form submission from ${name}`,
        headline: "New Customer Inquiry",
        body: `
          <p style="color:#2C2C2C;margin:0 0 16px;font-size:15px;">A new inquiry was submitted through the website contact form.</p>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border:1px solid #E8E3D8;border-radius:8px;overflow:hidden;">
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;width:100px;background:#F5F3ED;">Name</td>
              <td style="padding:10px 16px;font-size:14px;color:#2C2C2C;background:#F5F3ED;">${name}</td>
            </tr>
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;background:#FAFAF7;">Email</td>
              <td style="padding:10px 16px;font-size:14px;background:#FAFAF7;"><a href="mailto:${email}" style="color:#A6863B;text-decoration:none;font-weight:600;">${email}</a></td>
            </tr>
            ${phone ? `<tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;background:#F5F3ED;">Phone</td>
              <td style="padding:10px 16px;font-size:14px;color:#2C2C2C;background:#F5F3ED;">${phone}</td>
            </tr>` : ""}
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;background:#FAFAF7;">Subject</td>
              <td style="padding:10px 16px;font-size:14px;color:#2C2C2C;background:#FAFAF7;">${subject}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:16px;font-size:14px;color:#4A4540;line-height:1.7;background:#F5F3ED;border-top:1px solid #E8E3D8;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
                ${message.replace(/\n/g, "<br>")}
              </td>
            </tr>
          </table>
        `,
        ctaText: "Reply via Email",
        ctaUrl: `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`,
        footer: "This notification was sent automatically when a customer submitted the contact form on vitorra.org.",
      })
    );

    // ── (b) CUSTOMER AUTO-REPLY ──
    if (email) {
      await sendEmail(
        email,
        `We've received your inquiry — Vitorra Holdings`,
        emailTemplate({
          preheader: "Thank you for contacting Vitorra Holdings. We'll respond within 24 hours.",
          headline: `Thank you, ${name.split(" ")[0]}!`,
          body: `
            <p style="color:#4A4540;margin:0 0 16px;">We've received your message and a member of our team will get back to you within <strong style="color:#2C2C2C;">24 business hours</strong>.</p>
            
            <div style="padding:16px;background:#F5F3ED;border-radius:8px;border:1px solid #E8E3D8;margin:16px 0;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;">Your message</p>
              <p style="margin:0;font-size:14px;color:#6B6560;font-style:italic;line-height:1.6;">"${message.length > 200 ? message.substring(0, 200) + "..." : message}"</p>
            </div>

            <p style="color:#6B6560;margin:16px 0 0;font-size:13px;">
              If your matter is urgent, feel free to reach us directly:
            </p>
            <p style="margin:8px 0;font-size:14px;">
              📧 <a href="mailto:vitorraholdingsltd@gmail.com" style="color:#A6863B;text-decoration:none;">vitorraholdingsltd@gmail.com</a><br>
              📞 <a href="tel:+256740026118" style="color:#A6863B;text-decoration:none;">+256 740 026 118</a><br>
              💬 <a href="https://wa.me/256740026294" style="color:#A6863B;text-decoration:none;">WhatsApp</a>
            </p>
          `,
          ctaText: "Visit Our Website",
          ctaUrl: FRONTEND_URL,
        })
      );
    }

    // Mark as processed
    await snap.ref.update({emailSent: true, emailSentAt: new Date().toISOString()});
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 2: Welcome Email — New User Registration
// Fires when a new user profile is created in Firestore.
// ═══════════════════════════════════════════════════════════════════════════════

export const onNewUser = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap) => {
    const user = snap.data();
    const name = user.displayName || "there";
    const email = user.email;
    const isB2B = user.role === "b2b" || user.accountType === "business";

    // Don't send welcome emails to admin/team accounts
    const adminRoles = ["admin", "Super Admin", "Ops Manager", "Viewer"];
    if (adminRoles.includes(user.role)) {
      console.log(`Skipping welcome email for admin: ${email}`);
      return;
    }

    if (!email) return;

    await sendEmail(
      email,
      `Welcome to Vitorra Holdings${isB2B ? " — Business Account" : ""}`,
      emailTemplate({
        preheader: "Your account is ready. Explore our portfolio of premium products.",
        headline: `Welcome, ${name.split(" ")[0]}! 🎉`,
        body: `
          <p style="color:#4A4540;margin:0 0 16px;">Your ${isB2B ? "business " : ""}account has been successfully created. You now have access to our full range of products and services.</p>
          
          <div style="margin:20px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%" style="padding:8px;">
                  <div style="padding:16px;background:#F5F3ED;border-radius:8px;border:1px solid #E8E3D8;text-align:center;">
                    <div style="font-size:20px;margin-bottom:6px;">🛡️</div>
                    <div style="font-size:13px;font-weight:600;color:#2C2C2C;margin-bottom:4px;">SEAL Wound Care</div>
                    <div style="font-size:11px;color:#6B6560;">Hemostatic Technology</div>
                  </div>
                </td>
                <td width="50%" style="padding:8px;">
                  <div style="padding:16px;background:#F5F3ED;border-radius:8px;border:1px solid #E8E3D8;text-align:center;">
                    <div style="font-size:20px;margin-bottom:6px;">☕</div>
                    <div style="font-size:13px;font-weight:600;color:#2C2C2C;margin-bottom:4px;">Premium Coffee</div>
                    <div style="font-size:11px;color:#6B6560;">Direct Export Arabica</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:8px;">
                  <div style="padding:16px;background:#F5F3ED;border-radius:8px;border:1px solid #E8E3D8;text-align:center;">
                    <div style="font-size:20px;margin-bottom:6px;">⛽</div>
                    <div style="font-size:13px;font-weight:600;color:#2C2C2C;margin-bottom:4px;">Fuel Eco Tech</div>
                    <div style="font-size:11px;color:#6B6560;">Efficiency Systems</div>
                  </div>
                </td>
                <td width="50%" style="padding:8px;">
                  <div style="padding:16px;background:#F5F3ED;border-radius:8px;border:1px solid #E8E3D8;text-align:center;">
                    <div style="font-size:20px;margin-bottom:6px;">🚛</div>
                    <div style="font-size:13px;font-weight:600;color:#2C2C2C;margin-bottom:4px;">Logistics</div>
                    <div style="font-size:11px;color:#6B6560;">Global Supply Chain</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          ${isB2B ? `
          <div style="padding:14px 16px;background:#FBF5E6;border-radius:8px;border:1px solid #E8D9A8;margin:16px 0;">
            <p style="margin:0;font-size:13px;color:#A6863B;">
              <strong>🏢 Business Account Benefits:</strong><br>
              <span style="color:#6B6560;">Bulk pricing, dedicated account manager, and priority support are available for verified business accounts.</span>
            </p>
          </div>` : ""}

          <p style="color:#6B6560;margin:16px 0 0;font-size:13px;">
            Access your portal anytime to manage orders, track shipments, and update your profile.
          </p>
        `,
        ctaText: "Go to Your Portal",
        ctaUrl: `${FRONTEND_URL}/portal`,
      })
    );
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 3: Order Confirmation Email
// Fires when a new order is created. Sends the customer a detailed receipt.
// ═══════════════════════════════════════════════════════════════════════════════

export const onOrderCreated = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap) => {
    const order = snap.data();
    const email = order.customerEmail;
    const name = order.customerName || "Customer";

    if (!email) {
      console.warn(`Order ${snap.id} has no customerEmail. Skipping.`);
      return;
    }

    // Build items table
    const itemsHtml = (order.items || []).map((item: any) => `
      <tr style="border-bottom:1px solid #E8E3D8;">
        <td style="padding:10px 16px;font-size:14px;color:#2C2C2C;background:#FAFAF7;">${item.name}</td>
        <td style="padding:10px 16px;font-size:14px;color:#6B6560;background:#FAFAF7;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 16px;font-size:14px;color:#A6863B;background:#FAFAF7;text-align:right;font-weight:600;">${fmtUGX(item.price * item.quantity)}</td>
      </tr>
    `).join("");

    const paymentInfo = order.paymentMethod === "bank_transfer" ? `
      <div style="padding:16px;background:#FBF5E6;border-radius:8px;border:1px solid #E8D9A8;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#A6863B;">💳 Bank Transfer Details</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:13px;color:#4A4540;">
          <tr><td style="padding:2px 16px 2px 0;color:#A6863B;font-weight:600;">Bank</td><td>Stanbic Bank Uganda</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#A6863B;font-weight:600;">Account</td><td>Vitorra Holdings Limited</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#A6863B;font-weight:600;">Number</td><td style="color:#2C2C2C;font-weight:600;">9030005678901</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#A6863B;font-weight:600;">Reference</td><td style="color:#A6863B;font-weight:700;">${snap.id}</td></tr>
        </table>
        <p style="margin:10px 0 0;font-size:12px;color:#6B6560;">Please include your Order ID as the payment reference.</p>
      </div>
    ` : "";

    await sendEmail(
      email,
      `Order Confirmed: ${snap.id} — Vitorra Holdings`,
      emailTemplate({
        preheader: `Your order ${snap.id} has been placed. Total: ${fmtUGX(order.total)}`,
        headline: `Order Confirmed ✓`,
        body: `
          <p style="color:#4A4540;margin:0 0 8px;">Hi ${name.split(" ")[0]}, thank you for your order!</p>
          <p style="color:#6B6560;margin:0 0 20px;font-size:13px;">Here's a summary of your purchase.</p>

          <div style="padding:12px 16px;background:#F5F3ED;border-radius:8px 8px 0 0;border:1px solid #E8E3D8;border-bottom:none;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="font-size:12px;color:#A6863B;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Order ID</td>
                <td style="text-align:right;font-size:16px;color:#A6863B;font-weight:700;font-family:monospace;">${snap.id}</td>
              </tr>
            </table>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E8E3D8;border-radius:0 0 8px 8px;overflow:hidden;">
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:8px 16px;font-size:11px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;background:#F5F3ED;">Item</td>
              <td style="padding:8px 16px;font-size:11px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;background:#F5F3ED;text-align:center;">Qty</td>
              <td style="padding:8px 16px;font-size:11px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;background:#F5F3ED;text-align:right;">Total</td>
            </tr>
            ${itemsHtml}
            ${order.shippingCost ? `
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td colspan="2" style="padding:8px 16px;font-size:13px;color:#6B6560;background:#F5F3ED;">Shipping</td>
              <td style="padding:8px 16px;font-size:13px;color:#6B6560;background:#F5F3ED;text-align:right;">${fmtUGX(order.shippingCost)}</td>
            </tr>` : ""}
            <tr>
              <td colspan="2" style="padding:12px 16px;font-size:15px;font-weight:700;color:#2C2C2C;background:#F5F3ED;">Grand Total</td>
              <td style="padding:12px 16px;font-size:18px;font-weight:700;color:#A6863B;background:#F5F3ED;text-align:right;">${fmtUGX(order.total)}</td>
            </tr>
          </table>

          ${paymentInfo}

          <div style="margin:20px 0 0;padding:12px 16px;background:#F5F3ED;border-radius:8px;border:1px solid #E8E3D8;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;letter-spacing:0.5px;">Shipping To</p>
            <p style="margin:0;font-size:14px;color:#4A4540;line-height:1.5;">${order.shippingAddress || "Pickup"}</p>
          </div>

          <p style="color:#6B6560;margin:20px 0 0;font-size:13px;">
            You'll receive updates as your order progresses. Track your order anytime in your portal.
          </p>
        `,
        ctaText: "Track Your Order",
        ctaUrl: `${FRONTEND_URL}/portal`,
        footer: "If you have questions about this order, reply to this email or contact our support team.",
      })
    );

    // Also notify admin of new order
    await sendEmail(
      ADMIN_EMAIL,
      `📦 New Order: ${snap.id} — ${fmtUGX(order.total)}`,
      emailTemplate({
        preheader: `New order from ${name} for ${fmtUGX(order.total)}`,
        headline: `New Order Received`,
        body: `
          <p style="color:#4A4540;margin:0 0 16px;">A new order has been placed.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E8E3D8;border-radius:8px;overflow:hidden;">
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;background:#F5F3ED;width:120px;">Order ID</td>
              <td style="padding:10px 16px;font-size:14px;color:#A6863B;font-weight:700;background:#F5F3ED;font-family:monospace;">${snap.id}</td>
            </tr>
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;background:#FAFAF7;">Customer</td>
              <td style="padding:10px 16px;font-size:14px;color:#2C2C2C;background:#FAFAF7;">${name} (${email})</td>
            </tr>
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;background:#F5F3ED;">Items</td>
              <td style="padding:10px 16px;font-size:14px;color:#4A4540;background:#F5F3ED;">${(order.items || []).length} item(s)</td>
            </tr>
            <tr style="border-bottom:1px solid #E8E3D8;">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;background:#FAFAF7;">Total</td>
              <td style="padding:10px 16px;font-size:16px;color:#A6863B;font-weight:700;background:#FAFAF7;">${fmtUGX(order.total)}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#A6863B;text-transform:uppercase;background:#F5F3ED;">Payment</td>
              <td style="padding:10px 16px;font-size:14px;color:#6B6560;background:#F5F3ED;">${order.paymentMethod || "bank_transfer"}</td>
            </tr>
          </table>
        `,
        ctaText: "View in Admin Panel",
        ctaUrl: `${FRONTEND_URL}/admin/dashboard`,
      })
    );

    // Mark email sent
    await snap.ref.update({confirmationEmailSent: true});
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 4: Newsletter Subscriber Welcome
// Fires when someone subscribes to the newsletter.
// ═══════════════════════════════════════════════════════════════════════════════

export const onNewSubscriber = functions.firestore
  .document("subscribers/{docId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    const email = data.email;

    if (!email) return;

    await sendEmail(
      email,
      "Welcome to Vitorra Insights 📬",
      emailTemplate({
        preheader: "You're subscribed! Get the latest from Vitorra Holdings.",
        headline: "You're In! 🎯",
        body: `
          <p style="color:#4A4540;margin:0 0 16px;">Thank you for subscribing to <strong style="color:#2C2C2C;">Vitorra Insights</strong> — our newsletter covering industry developments, product launches, and company milestones.</p>

          <div style="margin:20px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding:12px 16px;background:#F5F3ED;border-radius:8px;border:1px solid #E8E3D8;">
                  <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#2C2C2C;">What to expect:</p>
                  <p style="margin:0;font-size:13px;color:#6B6560;line-height:1.8;">
                    ✦ Product launches and technology updates<br>
                    ✦ Industry insights and market analysis<br>
                    ✦ Company milestones and partnership announcements<br>
                    ✦ Exclusive offers for subscribers
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <p style="color:#6B6560;margin:0;font-size:13px;">We respect your inbox — expect quality updates, not spam.</p>
        `,
        ctaText: "Read Latest News",
        ctaUrl: `${FRONTEND_URL}/news`,
        footer: "You subscribed via vitorra.org. If this wasn't you, please ignore this email.",
      })
    );

    await snap.ref.update({welcomeEmailSent: true});
  });
