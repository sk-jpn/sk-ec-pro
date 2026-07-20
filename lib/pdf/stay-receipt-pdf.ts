import { existsSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit";

export type StayReceiptItem = { description: string; quantity: number; unitPrice: number; amount: number };
export type StayReceiptData = {
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

const regularFont = join(process.cwd(), "node_modules", "@fontsource", "noto-sans-jp", "files", "noto-sans-jp-japanese-400-normal.woff");
const boldFont = join(process.cwd(), "node_modules", "@fontsource", "noto-sans-jp", "files", "noto-sans-jp-japanese-700-normal.woff");
const ink = "#17202A";
const muted = "#64748B";
const line = "#94A3B8";
const accent = "#0F766E";
const soft = "#F8FAFC";

function yen(value: number) { return `${new Intl.NumberFormat("ja-JP").format(value)}円`; }
function dateLabel(value: string) { const [year, month, day] = value.split("-"); return `${year}年${Number(month)}月${Number(day)}日`; }

export async function generateStayReceiptPdf(data: StayReceiptData, options: StayReceiptOptions = {}) {
  const doc = new PDFDocument({ size: "A4", margins: { top: 38, right: 42, bottom: 38, left: 42 }, bufferPages: true, info: { Title: `領収書 ${data.receiptNumber}`, Author: "Formosa Japan", Subject: `宿泊予約 ${data.bookingNumber} 領収書` } });
  doc.registerFont("NotoSansJP", regularFont);
  doc.registerFont("NotoSansJP-Bold", boldFont);
  doc.font("NotoSansJP");
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });

  const left = 42;
  const right = 553;
  const width = right - left;
  doc.font("NotoSansJP-Bold").fontSize(22).fillColor(ink).text("領 収 書", left, 42, { width, align: "center" });
  doc.moveTo(left, 78).lineTo(right, 78).lineWidth(1.2).strokeColor(accent).stroke();

  doc.font("NotoSansJP-Bold").fontSize(13).fillColor(ink).text(`${data.customerName} 様`, left, 101, { width: 280 });
  doc.moveTo(left, 123).lineTo(320, 123).lineWidth(0.5).strokeColor(line).stroke();

  const metaX = 354;
  [["領収日", dateLabel(data.receiptDate)], ["領収書番号", data.receiptNumber], ["予約番号", data.bookingNumber]].forEach(([label, value], index) => {
    const y = 96 + index * 20;
    doc.font("NotoSansJP").fontSize(8).fillColor(muted).text(label, metaX, y, { width: 70 });
    doc.font("NotoSansJP-Bold").fontSize(8.5).fillColor(ink).text(value, metaX + 70, y, { width: 129, align: "right" });
  });

  const issuerName = process.env.RECEIPT_ISSUER_NAME || "Formosa Japan / 神木新之介";
  const issuerAddress = process.env.RECEIPT_ISSUER_ADDRESS || "〒273-0011 千葉県船橋市湊町3-22-12";
  const registrationNumber = process.env.RECEIPT_REGISTRATION_NUMBER || "T6810016629454";
  if (options.logoPath && existsSync(options.logoPath)) doc.image(options.logoPath, 413, 167, { fit: [140, 45], align: "right" });
  doc.font("NotoSansJP-Bold").fontSize(9).fillColor(ink).text(issuerName, 342, 217, { width: 211, align: "right" });
  doc.font("NotoSansJP").fontSize(7.5).fillColor(muted).text(issuerAddress, 322, 233, { width: 231, align: "right" });
  doc.text(`登録番号 ${registrationNumber}`, 342, 247, { width: 211, align: "right" });

  doc.font("NotoSansJP").fontSize(9).fillColor(ink).text("下記の金額を正に領収いたしました。", left, 171);
  doc.roundedRect(left, 193, 270, 68, 3).fill(soft).strokeColor(line).stroke();
  doc.font("NotoSansJP").fontSize(8).fillColor(muted).text("領収金額（税込）", left + 14, 207);
  doc.font("NotoSansJP-Bold").fontSize(22).fillColor(ink).text(yen(data.totalAmount), left + 14, 226, { width: 242, align: "right" });

  let y = 285;
  const columns = [left, 334, 397, 470, right];
  doc.rect(left, y, width, 27).fill(accent);
  [["摘要", columns[0], columns[1] - columns[0], "left"], ["数量", columns[1], columns[2] - columns[1], "center"], ["単価", columns[2], columns[3] - columns[2], "right"], ["明細金額", columns[3], columns[4] - columns[3], "right"]].forEach(([label, x, cellWidth, align]) => doc.font("NotoSansJP-Bold").fontSize(8).fillColor("#FFFFFF").text(String(label), Number(x) + 7, y + 8, { width: Number(cellWidth) - 14, align: align as "left" | "center" | "right" }));
  y += 27;
  data.items.forEach((item, index) => {
    const rowHeight = 28;
    if (index % 2 === 1) doc.rect(left, y, width, rowHeight).fill(soft);
    doc.font("NotoSansJP").fontSize(8).fillColor(ink).text(item.description, columns[0] + 7, y + 9, { width: columns[1] - columns[0] - 14, ellipsis: true, lineBreak: false });
    doc.text(String(item.quantity), columns[1] + 7, y + 9, { width: columns[2] - columns[1] - 14, align: "center" });
    doc.text(yen(item.unitPrice), columns[2] + 7, y + 9, { width: columns[3] - columns[2] - 14, align: "right" });
    doc.font("NotoSansJP-Bold").text(yen(item.amount), columns[3] + 7, y + 9, { width: columns[4] - columns[3] - 14, align: "right" });
    doc.moveTo(left, y + rowHeight).lineTo(right, y + rowHeight).lineWidth(0.4).strokeColor(line).stroke();
    y += rowHeight;
  });
  while (y < 480) { doc.moveTo(left, y + 28).lineTo(right, y + 28).lineWidth(0.25).strokeColor("#CBD5E1").stroke(); y += 28; }

  const tax = Math.floor(data.totalAmount * 10 / 110);
  const taxBase = data.totalAmount - tax;
  const summaryX = 334;
  doc.rect(summaryX, 511, right - summaryX, 56).strokeColor(line).stroke();
  doc.font("NotoSansJP").fontSize(8).fillColor(ink).text("内訳", summaryX + 8, 520);
  doc.text("10%対象（税抜）", summaryX + 49, 520, { width: 92 });
  doc.font("NotoSansJP-Bold").text(yen(taxBase), summaryX + 142, 520, { width: 68, align: "right" });
  doc.font("NotoSansJP").text("消費税（10%）", summaryX + 49, 542, { width: 92 });
  doc.font("NotoSansJP-Bold").text(yen(tax), summaryX + 142, 542, { width: 68, align: "right" });

  doc.rect(left, 585, width, 108).strokeColor(line).stroke();
  doc.font("NotoSansJP-Bold").fontSize(8.5).fillColor(ink).text("備考", left + 10, 596);
  doc.font("NotoSansJP").fontSize(8).fillColor(muted).text(`${data.listingName} 宿泊代として\n宿泊期間: ${dateLabel(data.checkInDate)} - ${dateLabel(data.checkOutDate)}\n支払方法: ${data.paymentMethod}`, left + 10, 618, { width: width - 20, lineGap: 4 });
  doc.font("NotoSansJP").fontSize(7).fillColor(muted).text("1 / 1", left, 784, { width, align: "center", lineBreak: false });
  doc.end();
  return completed;
}
