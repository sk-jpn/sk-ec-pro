export type QuoteCalculationItem = {
  quantity: number;
  unitPrice: number;
};

export type QuoteAdjustments = {
  deposit: number;
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
    + adjustments.deposit
    + adjustments.internationalShippingFee
    + adjustments.agencyFee
    + adjustments.otherFee
    + adjustments.tax
    - adjustments.discount,
  );

  return { subtotals, productTotal, total };
}

export function calculateQuoteTax(taxableAmount: number, taxRate: number) {
  if (![0, 8, 10].includes(taxRate)) return 0;
  return Math.max(0, Math.floor(Math.max(0, taxableAmount) * taxRate / 100));
}
