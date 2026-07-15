export const PAYMENT_METHODS = {
  bankTransfer: "銀行振込",
  stripeCard: "Stripeクレジットカード",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// 料率を変更する場合はこの値だけを更新します。
export const STRIPE_CARD_FEE_RATE = 0.035;

export function calculateCardPaymentFee(estimateTotal: number) {
  return Math.round(estimateTotal * STRIPE_CARD_FEE_RATE);
}
