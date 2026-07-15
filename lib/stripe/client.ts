import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY が設定されていません。");
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}
