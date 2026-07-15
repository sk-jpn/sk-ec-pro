import { existsSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { calculateQuoteTotals } from "@/lib/estimates/quote-calculations";

export type EstimatePdfItem = {
  productName: string | null;
  url: string;
  quantity: number;
  unitPrice: number;
  image?: Buffer;
};

export type EstimatePdfData = {
  estimateNo: string;
  issueDate: string;
  customerName: string;
  customerEmail: string;
  prefecture: string;
  items: EstimatePdfItem[];
  chinaShippingFee: number;
  internationalShippingFee: number;
  agencyFee: number;
  otherFee: number;
  discount: number;
  tax: number;
  paymentMethod: string;
  validUntil: string | null;
};

export type EstimatePdfOptions = {
  logoPath?: string;
};

const COLORS = {
  ink: "#17202A",
  muted: "#64748B",
  line: "#D7DEE7",
  soft: "#F4F7F9",
  accent: "#0F766E",
  accentDark: "#115E59",
  white: "#FFFFFF",
};

const regularFont = join(process.cwd(), "node_modules", "@fontsource", "noto-sans-jp", "files", "noto-sans-jp-japanese-400-normal.woff");
const boldFont = join(process.cwd(), "node_modules", "@fontsource", "noto-sans-jp", "files", "noto-sans-jp-japanese-700-normal.woff");

function yen(value: number) {
  const formatted = new Intl.NumberFormat("ja-JP").format(Math.abs(value));
  return value < 0 ? `-¥${formatted}` : `¥${formatted}`;
}

function dateLabel(value: string | null) {
  if (!value) return "別途ご案内";
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function productLabel(item: EstimatePdfItem) {
  if (item.productName?.trim()) return item.productName.trim();
  try {
    const url = new URL(item.url);
    return `${url.hostname}${url.pathname}`.slice(0, 48);
  } catch {
    return item.url ? item.url.slice(0, 48) : "商品画像を参照";
  }
}

export async function generateEstimatePdf(data: EstimatePdfData, options: EstimatePdfOptions = {}) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 42, right: 46, bottom: 42, left: 46 },
    bufferPages: true,
    info: {
      Title: `見積書 ${data.estimateNo}`,
      Author: "Formosa Japan",
      Subject: "SK EC Pro 見積書",
    },
  });
  doc.registerFont("NotoSansJP", regularFont);
  doc.registerFont("NotoSansJP-Bold", boldFont);
  doc.font("NotoSansJP");

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = 46;
  const right = 549;
  const width = right - left;

  if (options.logoPath && existsSync(options.logoPath)) {
    doc.image(options.logoPath, left, 42, { fit: [112, 34], valign: "center" });
  } else {
    doc.font("NotoSansJP-Bold").fontSize(15).fillColor(COLORS.accentDark).text("FORMOSA JAPAN", left, 49);
  }
  doc.font("NotoSansJP").fontSize(8.5).fillColor(COLORS.muted).text("SK EC Pro", left, 70);
  doc.font("NotoSansJP-Bold").fontSize(25).fillColor(COLORS.ink).text("御 見 積 書", 335, 44, { width: 214, align: "right" });
  doc.moveTo(left, 91).lineTo(right, 91).lineWidth(1.2).strokeColor(COLORS.accent).stroke();

  doc.font("NotoSansJP-Bold").fontSize(13).fillColor(COLORS.ink).text(`${data.customerName} 様`, left, 111, { width: 290 });
  doc.font("NotoSansJP").fontSize(8.5).fillColor(COLORS.muted).text(data.customerEmail, left, 134, { width: 290 });
  doc.text(data.prefecture, left, 149, { width: 290 });

  const metaX = 360;
  const metaRows = [["見積番号", data.estimateNo], ["発行日", dateLabel(data.issueDate)]];
  metaRows.forEach(([label, value], index) => {
    const y = 109 + index * 24;
    doc.font("NotoSansJP").fontSize(8).fillColor(COLORS.muted).text(label, metaX, y, { width: 72 });
    doc.font("NotoSansJP-Bold").fontSize(9).fillColor(COLORS.ink).text(value, metaX + 72, y, { width: 117, align: "right" });
    doc.moveTo(metaX, y + 16).lineTo(right, y + 16).lineWidth(0.5).strokeColor(COLORS.line).stroke();
  });

  doc.font("NotoSansJP").fontSize(9).fillColor(COLORS.ink).text("下記の通りお見積り申し上げます。", left, 183);

  let y = 208;
  const columns = [left, 338, 394, 472, right];
  doc.rect(left, y, width, 27).fill(COLORS.accentDark);
  const headers = [["商品名 / URL", columns[0], columns[1] - columns[0], "left"], ["数量", columns[1], columns[2] - columns[1], "center"], ["単価", columns[2], columns[3] - columns[2], "right"], ["小計", columns[3], columns[4] - columns[3], "right"]] as const;
  headers.forEach(([label, x, cellWidth, align]) => doc.font("NotoSansJP-Bold").fontSize(8.5).fillColor(COLORS.white).text(label, x + 8, y + 8, { width: cellWidth - 16, align }));
  y += 27;

  data.items.forEach((item, index) => {
    const rowHeight = data.items.length > 6 ? 23 : 30;
    const textOffset = data.items.length > 6 ? 6 : 9;
    if (index % 2 === 1) doc.rect(left, y, width, rowHeight).fill(COLORS.soft);
    let productTextX = columns[0] + 8;
    if (item.image) {
      try { doc.image(item.image, productTextX, y + 4, { fit: [22, rowHeight - 8], align: "center", valign: "center" }); productTextX += 28; } catch { /* 壊れた画像はテキスト表示のみ継続 */ }
    }
    doc.font("NotoSansJP").fontSize(8.2).fillColor(COLORS.ink).text(productLabel(item), productTextX, y + textOffset, { width: columns[1] - productTextX - 8, ellipsis: true, lineBreak: false });
    doc.text(String(item.quantity), columns[1] + 8, y + textOffset, { width: columns[2] - columns[1] - 16, align: "center" });
    doc.text(yen(item.unitPrice), columns[2] + 8, y + textOffset, { width: columns[3] - columns[2] - 16, align: "right" });
    doc.font("NotoSansJP-Bold").text(yen(item.unitPrice * item.quantity), columns[3] + 8, y + textOffset, { width: columns[4] - columns[3] - 16, align: "right" });
    doc.moveTo(left, y + rowHeight).lineTo(right, y + rowHeight).lineWidth(0.35).strokeColor(COLORS.line).stroke();
    y += rowHeight;
  });

  const { productTotal, total } = calculateQuoteTotals(data.items, data);
  y += 16;
  const summaryX = 310;
  const summaryWidth = right - summaryX;
  const totals = [
    ["商品合計", productTotal],
    ["中国国内送料", data.chinaShippingFee],
    ["国際送料", data.internationalShippingFee],
    ["代行手数料", data.agencyFee],
    ["その他", data.otherFee],
    ["割引", -data.discount],
    ["消費税", data.tax],
  ] as const;
  totals.forEach(([label, value]) => {
    doc.font("NotoSansJP").fontSize(8.5).fillColor(COLORS.muted).text(label, summaryX, y + 5, { width: 115 });
    doc.font("NotoSansJP-Bold").fillColor(COLORS.ink).text(yen(value), summaryX + 115, y + 5, { width: summaryWidth - 115, align: "right" });
    doc.moveTo(summaryX, y + 20).lineTo(right, y + 20).lineWidth(0.35).strokeColor(COLORS.line).stroke();
    y += 21;
  });

  y += 8;
  doc.roundedRect(summaryX, y, summaryWidth, 53, 3).fill(COLORS.accentDark);
  doc.font("NotoSansJP-Bold").fontSize(10).fillColor(COLORS.white).text("合計金額（税込）", summaryX + 14, y + 10, { width: 105 });
  doc.font("NotoSansJP-Bold").fontSize(18).text(yen(total), summaryX + 110, y + 18, { width: summaryWidth - 124, align: "right" });

  const footerY = Math.max(y + 79, 702);
  doc.moveTo(left, footerY).lineTo(right, footerY).lineWidth(0.7).strokeColor(COLORS.line).stroke();
  doc.font("NotoSansJP-Bold").fontSize(8.5).fillColor(COLORS.ink).text("お支払い・ご案内", left, footerY + 13);
  doc.font("NotoSansJP").fontSize(8).fillColor(COLORS.muted)
    .text(`支払方法: ${data.paymentMethod || "別途ご案内"}`, left, footerY + 33)
    .text(`有効期限: ${dateLabel(data.validUntil)}`, left, footerY + 48);
  doc.font("NotoSansJP-Bold").fontSize(8.5).fillColor(COLORS.ink).text("Formosa Japan / SK EC Pro", 310, footerY + 13, { width: 239, align: "right" });
  doc.font("NotoSansJP").fontSize(8).fillColor(COLORS.muted)
    .text("contact@formosajapan.com", 310, footerY + 33, { width: 239, align: "right", link: "mailto:contact@formosajapan.com" })
    .text("https://formosajapan.com/ec", 310, footerY + 48, { width: 239, align: "right", link: "https://formosajapan.com/ec" });

  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page += 1) {
    doc.switchToPage(page);
    doc.font("NotoSansJP").fontSize(7).fillColor(COLORS.muted).text(`${page + 1} / ${range.count}`, left, 774, { width, align: "center", lineBreak: false });
  }

  doc.end();
  return completed;
}
