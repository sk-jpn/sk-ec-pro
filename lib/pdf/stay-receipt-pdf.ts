import { existsSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit";

export type StayReceiptLocale = "ja" | "en" | "zh-CN" | "ko" | "zh-TW";
export type StayReceiptItemKind = "accommodation" | "additionalGuest" | "cleaning" | "discount" | "cardFee";
export type StayReceiptItem = { kind: StayReceiptItemKind; nights?: number; quantity: number; unitPrice: number; amount: number };
export type StayReceiptData = {
  locale?: StayReceiptLocale;
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  bookingNumber: string;
  listingName: string;
  checkInDate: string;
  checkOutDate: string;
  paymentMethod: string;
  items: StayReceiptItem[];
  totalAmount: number;
};

export type StayReceiptOptions = { logoPath?: string };

export function normalizeStayReceiptLocale(value?: string | null): StayReceiptLocale {
  if (value === "en" || value === "ko" || value === "zh-TW" || value === "zh-CN") return value;
  if (value === "zh") return "zh-CN";
  return "ja";
}

function receiptFontPaths(locale: StayReceiptLocale) {
  const root = process.cwd();
  if (locale === "zh-CN") return { regular: join(root, "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff"), bold: join(root, "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff") };
  if (locale === "ko") return { regular: join(root, "node_modules/@fontsource/noto-sans-kr/files/noto-sans-kr-korean-400-normal.woff"), bold: join(root, "node_modules/@fontsource/noto-sans-kr/files/noto-sans-kr-korean-700-normal.woff") };
  if (locale === "zh-TW") return { regular: join(root, "node_modules/@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-400-normal.woff"), bold: join(root, "node_modules/@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-700-normal.woff") };
  return { regular: join(root, "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff"), bold: join(root, "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff") };
}
const labels = {
  ja: { title: "領 収 書", honorific: " 様", receiptDate: "領収日", receiptNo: "領収書番号", bookingNo: "予約番号", registrationNo: "登録番号", statement: "下記の金額を正に領収いたしました。", total: "領収金額（税込）", description: "摘要", quantity: "数量", unitPrice: "単価", amount: "明細金額", breakdown: "内訳", taxable: "10%対象（税抜）", tax: "消費税（10%）", notes: "備考", stayCharge: "宿泊代として", stayPeriod: "宿泊期間", paymentMethod: "支払方法", accommodation: (n: number) => `宿泊料金（${n}泊）`, additionalGuest: "追加人数料金", cleaning: "清掃料金", discount: "連泊割引等", cardFee: "カード決済手数料", paid: "支払い済み", stripe_card: "クレジットカード（Stripe）", bank_transfer: "銀行振込", cash: "現金", card_manual: "カード", other: "その他" },
  en: { title: "RECEIPT", honorific: "", receiptDate: "Receipt date", receiptNo: "Receipt No.", bookingNo: "Booking No.", registrationNo: "Registration No.", statement: "We acknowledge receipt of the amount below.", total: "Total received (tax included)", description: "Description", quantity: "Qty", unitPrice: "Unit price", amount: "Amount", breakdown: "Breakdown", taxable: "10% taxable (excl. tax)", tax: "Consumption tax (10%)", notes: "Notes", stayCharge: "Accommodation charge", stayPeriod: "Stay period", paymentMethod: "Payment method", accommodation: (n: number) => `Accommodation (${n} nights)`, additionalGuest: "Additional guest fee", cleaning: "Cleaning fee", discount: "Extended-stay discount", cardFee: "Card processing fee", paid: "Paid", stripe_card: "Credit card (Stripe)", bank_transfer: "Bank transfer", cash: "Cash", card_manual: "Card", other: "Other" },
  "zh-CN": { title: "收 据", honorific: "", receiptDate: "收款日期", receiptNo: "收据编号", bookingNo: "预订编号", registrationNo: "登记编号", statement: "兹确认已收到下列款项。", total: "收款金额（含税）", description: "摘要", quantity: "数量", unitPrice: "单价", amount: "明细金额", breakdown: "明细", taxable: "10%应税金额（未税）", tax: "消费税（10%）", notes: "备注", stayCharge: "住宿费用", stayPeriod: "住宿期间", paymentMethod: "支付方式", accommodation: (n: number) => `住宿费（${n}晚）`, additionalGuest: "追加人数费用", cleaning: "清洁费", discount: "连住优惠", cardFee: "信用卡支付手续费", paid: "已支付", stripe_card: "信用卡（Stripe）", bank_transfer: "银行转账", cash: "现金", card_manual: "信用卡", other: "其他" },
  ko: { title: "영 수 증", honorific: " 님", receiptDate: "영수일", receiptNo: "영수증 번호", bookingNo: "예약 번호", registrationNo: "등록 번호", statement: "아래 금액을 정상적으로 수령하였습니다.", total: "수령 금액 세금 포함", description: "내역", quantity: "수량", unitPrice: "단가", amount: "금액", breakdown: "세금 내역", taxable: "과세 대상 세전", tax: "소비세", notes: "비고", stayCharge: "숙박 요금", stayPeriod: "숙박 기간", paymentMethod: "결제 방법", accommodation: () => "숙박 요금", additionalGuest: "추가 인원 요금", cleaning: "청소 요금", discount: "연박 할인", cardFee: "카드 결제 수수료", paid: "결제 완료", stripe_card: "신용카드", bank_transfer: "은행 송금", cash: "현금", card_manual: "카드", other: "기타" },
  "zh-TW": { title: "收 據", honorific: "", receiptDate: "收款日期", receiptNo: "收據編號", bookingNo: "預訂編號", registrationNo: "登記編號", statement: "茲確認已收到下列款項。", total: "收款金額 含稅", description: "摘要", quantity: "數量", unitPrice: "單價", amount: "明細金額", breakdown: "明細", taxable: "應稅金額 未稅", tax: "消費稅", notes: "備註", stayCharge: "住宿費用", stayPeriod: "住宿期間", paymentMethod: "付款方式", accommodation: () => "住宿費", additionalGuest: "追加人數費用", cleaning: "清潔費", discount: "連住優惠", cardFee: "信用卡付款手續費", paid: "已付款", stripe_card: "信用卡", bank_transfer: "銀行轉帳", cash: "現金", card_manual: "信用卡", other: "其他" },
} as const;

const intlLocale = { ja: "ja-JP", en: "en-US", "zh-CN": "zh-CN", ko: "ko-KR", "zh-TW": "zh-TW" } satisfies Record<StayReceiptLocale, string>;
const ink = "#17202A", muted = "#64748B", line = "#94A3B8", accent = "#0F766E", soft = "#F8FAFC";
function money(value: number, locale: StayReceiptLocale) { return new Intl.NumberFormat(intlLocale[locale], { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value); }
function dateLabel(value: string, locale: StayReceiptLocale) { return new Intl.DateTimeFormat(intlLocale[locale], { year: "numeric", month: locale === "en" ? "long" : "numeric", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }

export async function generateStayReceiptPdf(data: StayReceiptData, options: StayReceiptOptions = {}) {
  const locale = normalizeStayReceiptLocale(data.locale);
  const text = labels[locale];
  const files = receiptFontPaths(locale);
  const doc = new PDFDocument({ size: "A4", margins: { top: 38, right: 42, bottom: 38, left: 42 }, bufferPages: true, info: { Title: `${text.title} ${data.receiptNumber}`, Author: "Formosa Japan", Subject: `${data.bookingNumber} ${text.title}` } });
  doc.registerFont("ReceiptFont", files.regular); doc.registerFont("ReceiptFont-Bold", files.bold); doc.font("ReceiptFont");
  const baseFontDir = join(process.cwd(), "node_modules", "@fontsource", "noto-sans-jp", "files");
  doc.registerFont("BaseFont", join(baseFontDir, "noto-sans-jp-japanese-400-normal.woff")); doc.registerFont("BaseFont-Bold", join(baseFontDir, "noto-sans-jp-japanese-700-normal.woff"));
  if (locale === "zh-CN") {
    doc.registerFont("SCName111-Bold", join(process.cwd(), "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-111-700-normal.woff"));
    doc.registerFont("SCName113-Bold", join(process.cwd(), "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-113-700-normal.woff"));
  }
  const chunks: Buffer[] = []; doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  const left = 42, right = 553, width = right - left;
  doc.font("ReceiptFont-Bold").fontSize(22).fillColor(ink).text(text.title, left, 42, { width, align: "center" }); doc.moveTo(left, 78).lineTo(right, 78).lineWidth(1.2).strokeColor(accent).stroke();
  if (locale === "zh-CN") {
    let nameX = left;
    for (const character of data.customerName) {
      const nameFont = character === "杨" ? "SCName113-Bold" : character === "凯" ? "SCName111-Bold" : "ReceiptFont-Bold";
      doc.font(nameFont).fontSize(13).fillColor(ink).text(character, nameX, 101, { lineBreak: false });
      nameX += doc.widthOfString(character);
    }
  } else {
    doc.font("ReceiptFont-Bold").fontSize(13).fillColor(ink).text(`${data.customerName}${text.honorific}`, left, 101, { width: 280 });
  }
  doc.moveTo(left, 123).lineTo(320, 123).lineWidth(0.5).strokeColor(line).stroke();
  const metaX = 354;
  [[text.receiptDate, dateLabel(data.receiptDate, locale)], [text.receiptNo, data.receiptNumber], [text.bookingNo, data.bookingNumber]].forEach(([label, value], index) => { const y = 96 + index * 20; doc.font("ReceiptFont").fontSize(8).fillColor(muted).text(label, metaX, y, { width: 70 }); doc.font("BaseFont-Bold").fontSize(8.5).fillColor(ink).text(value, metaX + 70, y, { width: 129, align: "right" }); });
  const issuerName = process.env.RECEIPT_ISSUER_NAME || "Formosa Japan / 神木新之介", issuerAddress = process.env.RECEIPT_ISSUER_ADDRESS || "〒273-0011 千葉県船橋市湊町3-22-12", registrationNumber = process.env.RECEIPT_REGISTRATION_NUMBER || "T6810016629454";
  if (options.logoPath && existsSync(options.logoPath)) doc.image(options.logoPath, 413, 167, { fit: [140, 45], align: "right" });
  doc.font("BaseFont-Bold").fontSize(9).fillColor(ink).text(issuerName, 342, 217, { width: 211, align: "right" }); doc.font("BaseFont").fontSize(7.5).fillColor(muted).text(issuerAddress, 322, 233, { width: 231, align: "right" }); doc.font("ReceiptFont").text(text.registrationNo, 342, 247, { width: 105, align: "right" }); doc.font("BaseFont").text(registrationNumber, 450, 247, { width: 103, align: "right" });
  doc.font("ReceiptFont").fontSize(9).fillColor(ink).text(text.statement, left, 171); doc.roundedRect(left, 193, 270, 68, 3).fill(soft).strokeColor(line).stroke(); doc.font("ReceiptFont").fontSize(8).fillColor(muted).text(text.total, left + 14, 207); doc.font("BaseFont-Bold").fontSize(22).fillColor(ink).text(money(data.totalAmount, locale), left + 14, 226, { width: 242, align: "right" });
  let y = 285; const columns = [left, 334, 397, 470, right]; doc.rect(left, y, width, 27).fill(accent);
  [[text.description, columns[0], columns[1] - columns[0], "left"], [text.quantity, columns[1], columns[2] - columns[1], "center"], [text.unitPrice, columns[2], columns[3] - columns[2], "right"], [text.amount, columns[3], columns[4] - columns[3], "right"]].forEach(([label, x, cellWidth, align]) => doc.font("ReceiptFont-Bold").fontSize(8).fillColor("#FFFFFF").text(String(label), Number(x) + 7, y + 8, { width: Number(cellWidth) - 14, align: align as "left" | "center" | "right" })); y += 27;
  data.items.forEach((item, index) => { const rowHeight = 28; if (index % 2 === 1) doc.rect(left, y, width, rowHeight).fill(soft); const description = item.kind === "accommodation" ? text.accommodation(item.nights ?? 0) : text[item.kind]; doc.font("ReceiptFont").fontSize(8).fillColor(ink).text(description, columns[0] + 7, y + 9, { width: columns[1] - columns[0] - 14, ellipsis: true, lineBreak: false }); doc.font("BaseFont").text(String(item.quantity), columns[1] + 7, y + 9, { width: columns[2] - columns[1] - 14, align: "center" }); doc.text(money(item.unitPrice, locale), columns[2] + 7, y + 9, { width: columns[3] - columns[2] - 14, align: "right" }); doc.font("BaseFont-Bold").text(money(item.amount, locale), columns[3] + 7, y + 9, { width: columns[4] - columns[3] - 14, align: "right" }); doc.moveTo(left, y + rowHeight).lineTo(right, y + rowHeight).lineWidth(0.4).strokeColor(line).stroke(); y += rowHeight; });
  while (y < 480) { doc.moveTo(left, y + 28).lineTo(right, y + 28).lineWidth(0.25).strokeColor("#CBD5E1").stroke(); y += 28; }
  const tax = Math.floor(data.totalAmount * 10 / 110), taxBase = data.totalAmount - tax, summaryX = 334; doc.rect(summaryX, 511, right - summaryX, 56).strokeColor(line).stroke(); doc.font("ReceiptFont").fontSize(8).fillColor(ink).text(text.breakdown, summaryX + 8, 520); doc.text(text.taxable, summaryX + 49, 520, { width: 92 }); doc.font("BaseFont-Bold").text(money(taxBase, locale), summaryX + 142, 520, { width: 68, align: "right" }); doc.font("ReceiptFont").text(text.tax, summaryX + 49, 542, { width: 92 }); doc.font("BaseFont-Bold").text(money(tax, locale), summaryX + 142, 542, { width: 68, align: "right" });
  const paymentMethod = (text as Record<string, unknown>)[data.paymentMethod]; const paymentLabel = typeof paymentMethod === "string" ? paymentMethod : text.paid;
  doc.rect(left, 585, width, 108).strokeColor(line).stroke(); doc.font("ReceiptFont-Bold").fontSize(8.5).fillColor(ink).text(text.notes, left + 10, 596); doc.font("ReceiptFont").fontSize(8).fillColor(muted).text(text.stayCharge, left + 10, 618, { width: 92 }); doc.font("BaseFont").text(data.listingName, left + 105, 618); doc.font("ReceiptFont").text(text.stayPeriod, left + 10, 636, { width: 92 }); doc.font("BaseFont").text(`${data.checkInDate} - ${data.checkOutDate}`, left + 105, 636); doc.font("ReceiptFont").text(text.paymentMethod, left + 10, 654, { width: 92 }); doc.font("ReceiptFont").text(paymentLabel, left + 105, 654); doc.font("BaseFont").fontSize(7).fillColor(muted).text("1 / 1", left, 784, { width, align: "center", lineBreak: false });
  doc.end(); return completed;
}
