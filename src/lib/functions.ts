/**
 * Vitorra — Firebase Cloud Functions Client Wrapper
 * Provides typed functions to call the secure backend.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

// Uncomment for local development with Firebase emulator:
// connectFunctionsEmulator(functions, 'localhost', 5001);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface ValidatedCartItem {
  productId: string;
  variantId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inStock: boolean;
}

export interface ValidateCartResponse {
  validatedItems: ValidatedCartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}

export interface CreateOrderRequest {
  items: CartItemRequest[];
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  shippingMethod?: string;
  paymentMethod: 'flutterwave' | 'paypal' | 'bank_transfer';
  paymentReference?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  total: number;
  paymentMethod: string;
  status: string;
}

export interface PaymentInitResponse {
  gateway: string;
  // Flutterwave
  paymentLink?: string;
  txRef?: string;
  // PayPal
  paypalOrderId?: string;
  approvalUrl?: string;
  // Bank Transfer
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    reference: string;
  };
}

// ─── Callable Functions ──────────────────────────────────────────────────────

/**
 * Validates cart items against server-side prices and stock.
 * Call this when the user enters checkout.
 */
export async function validateCart(items: CartItemRequest[], shippingMethod?: string): Promise<ValidateCartResponse> {
  const fn = httpsCallable<any, ValidateCartResponse>(functions, 'validateCart');
  const result = await fn({ items, shippingMethod });
  return result.data;
}

/**
 * Creates an order with server-side price calculation and atomic inventory deduction.
 * The backend generates the order ID — never trust client-generated IDs.
 */
export async function createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
  const fn = httpsCallable<CreateOrderRequest, CreateOrderResponse>(functions, 'createOrder');
  const result = await fn(data);
  return result.data;
}

/**
 * Initializes a payment session with the specified gateway.
 * Returns a redirect URL (Flutterwave/PayPal) or bank details.
 */
export async function initializePayment(orderId: string, gateway: string): Promise<PaymentInitResponse> {
  const fn = httpsCallable<any, PaymentInitResponse>(functions, 'initializePayment');
  const result = await fn({ orderId, gateway });
  return result.data;
}

/**
 * Fetches order details (with ownership verification on the server).
 */
export async function getOrderDetails(orderId: string): Promise<any> {
  const fn = httpsCallable(functions, 'getOrderDetails');
  const result = await fn({ orderId });
  return result.data;
}
