export type QuoteCalculationItem = {
  quantity: number;
  unitPrice: number;
};

export type QuoteAdjustments = {
  chinaShippingFee: number;
  internationalShippingFee: number;
  agencyFee: number;
  otherFee: number;
  discount: number;
  tax: number;
};

export function calculateQuoteTotals(items: QuoteCalculationItem[], adjustments: QuoteAdjustments) {
  const subtotals = items.map((item) => item.quantity * item.unitPrice);
  const productTotal = subtotals.reduce((sum, subtotal) => sum + subtotal, 0);
  const total = Math.max(0,
    productTotal
    + adjustments.chinaShippingFee
    + adjustments.internationalShippingFee
    + adjustments.agencyFee
    + adjustments.otherFee
    + adjustments.tax
    - adjustments.discount,
  );

  return { subtotals, productTotal, total };
}
