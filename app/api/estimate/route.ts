import { Resend } from "resend";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ESTIMATE_IMAGE_BUCKET, MAX_IMAGES_PER_PRODUCT, validateEstimateImage } from "@/lib/estimates/image-files";

const MAX_PRODUCTS = 10;

type Product = {
  imageCount: number;
  url: string;
  quantity: string;
  color: string;
  size: string;
  model: string;
  request: string;
};

type EstimateRequest = {
  customer: {
    name: string;
    email: string;
    company: string;
    phone: string;
    marketplace: string;
    sellerQuestion: string;
    shipping: string;
    deadline: string;
    prefecture: string;
    notes: string;
    terms: boolean;
    privacy: boolean;
  };
  products: Product[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown, maxLength = 2_000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseRequest(value: unknown): EstimateRequest | null {
  if (!isRecord(value) || !isRecord(value.customer) || !Array.isArray(value.products)) return null;
  if (value.products.length < 1 || value.products.length > MAX_PRODUCTS) return null;

  const customer = {
    name: text(value.customer.name, 100),
    email: text(value.customer.email, 254),
    company: text(value.customer.company, 200),
    phone: text(value.customer.phone, 50),
    marketplace: text(value.customer.marketplace, 100),
    sellerQuestion: text(value.customer.sellerQuestion),
    shipping: text(value.customer.shipping, 100),
    deadline: text(value.customer.deadline, 200),
    prefecture: text(value.customer.prefecture, 20),
    notes: text(value.customer.notes, 5_000),
    terms: value.customer.terms === true,
    privacy: value.customer.privacy === true,
  };

  const products = value.products.map((item) => {
    if (!isRecord(item)) return null;
    return {
      imageCount: typeof item.imageCount === "number" ? item.imageCount : 0,
      url: text(item.url, 2_000),
      quantity: text(item.quantity, 20),
      color: text(item.color, 200),
      size: text(item.size, 200),
      model: text(item.model, 200),
      request: text(item.request, 2_000),
    };
  });

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email);
  const productsValid = products.every((item) =>
    item &&
    (!item.url || isWebUrl(item.url)) &&
    (Boolean(item.url) || item.imageCount > 0) &&
    item.imageCount >= 0 &&
    item.imageCount <= MAX_IMAGES_PER_PRODUCT &&
    Number.isInteger(Number(item.quantity)) &&
    Number(item.quantity) >= 1,
  );

  if (!customer.name || !emailValid || !customer.prefecture || !customer.terms || !customer.privacy || !productsValid) return null;
  return { customer, products: products as Product[] };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

function row(label: string, value: string) {
  if (!value) return "";
  return `<tr><th style="width:180px;padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top;color:#64748b;font-size:13px">${label}</th><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;line-height:1.7;word-break:break-word">${escapeHtml(value)}</td></tr>`;
}

function adminEmail(data: EstimateRequest, receivedAt: string, imageUrlsByProduct: string[][]) {
  const { customer, products } = data;
  const productSections = products.map((product, index) => {
    const imageUrls = imageUrlsByProduct[index] ?? [];
    const imageGallery = imageUrls.length
      ? `<div style="padding:14px 16px 4px"><p style="margin:0 0 10px;color:#64748b;font-size:13px">商品画像（リンクは7日間有効）</p><div>${imageUrls.map((url, imageIndex) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer" style="display:inline-block;margin:0 8px 10px 0;text-decoration:none"><img src="${escapeHtml(url)}" alt="商品 ${index + 1} 画像 ${imageIndex + 1}" width="120" height="120" style="display:block;width:120px;height:120px;object-fit:cover;border:1px solid #dbeafe;border-radius:8px;background:#f8fafc"></a>`).join("")}</div></div>`
      : "";
    return `
    <div style="margin-top:20px;border:1px solid #dbeafe;border-radius:12px;overflow:hidden">
      <h3 style="margin:0;padding:12px 16px;background:#eff6ff;color:#1d4ed8;font-size:16px">商品 ${index + 1}</h3>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        ${row("URL", product.url)}
        ${row("商品画像", `${product.imageCount}枚`)}
        ${row("数量", product.quantity)}
        ${row("色", product.color)}
        ${row("サイズ", product.size)}
        ${row("型番", product.model)}
        ${row("希望内容", product.request)}
      </table>
      ${imageGallery}
    </div>`;
  }).join("");

  return `<!doctype html><html lang="ja"><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a"><div style="max-width:720px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px"><p style="margin:0 0 8px;color:#2563eb;font-size:13px;font-weight:700">SK EC Pro</p><h1 style="margin:0 0 24px;font-size:24px">無料見積依頼を受け付けました</h1><table role="presentation" style="width:100%;border-collapse:collapse">${row("受付日時", receivedAt)}${row("お名前", customer.name)}${row("会社名", customer.company)}${row("メールアドレス", customer.email)}${row("電話番号", customer.phone)}${row("中国ECサイト名", customer.marketplace)}${row("お届け先都道府県", customer.prefecture)}${row("配送方法", customer.shipping)}${row("希望納期", customer.deadline)}${row("出品者への確認事項", customer.sellerQuestion)}${row("備考", customer.notes)}</table><h2 style="margin:28px 0 0;font-size:19px">商品一覧</h2>${productSections}</div></div></body></html>`;
}

function replyEmail(name: string) {
  return `<!doctype html><html lang="ja"><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a"><div style="max-width:640px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px"><p style="margin:0 0 8px;color:#2563eb;font-size:13px;font-weight:700">SK EC Pro</p><h1 style="margin:0 0 28px;font-size:24px">無料見積を受け付けました</h1><p style="margin:0 0 18px;line-height:1.8">${escapeHtml(name)} 様</p><p style="margin:0;line-height:1.9">見積依頼ありがとうございます。<br>担当者が確認後、ご連絡いたします。<br>このメールは自動送信です。</p><hr style="margin:28px 0;border:0;border-top:1px solid #e2e8f0"><p style="margin:0;color:#64748b;font-size:12px;line-height:1.7">SK EC Pro<br>Formosa Japan</p></div></div></body></html>`;
}

export async function POST(request: Request) {
  let body: unknown;
  let formData: FormData;
  try {
    formData = await request.formData();
    const payload = formData.get("payload");
    body = typeof payload === "string" ? JSON.parse(payload) : null;
  } catch {
    return Response.json({ message: "送信内容を確認できませんでした。入力画面から再度お試しください。" }, { status: 400 });
  }

  const data = parseRequest(body);
  if (!data) {
    return Response.json({ message: "入力内容に誤りがあります。内容を修正して再度お試しください。" }, { status: 400 });
  }

  const remarks = [
    data.customer.marketplace && `中国ECサイト: ${data.customer.marketplace}`,
    data.customer.deadline && `希望納期: ${data.customer.deadline}`,
    data.customer.sellerQuestion && `出品者への確認事項:\n${data.customer.sellerQuestion}`,
    data.customer.notes && `備考:\n${data.customer.notes}`,
  ].filter(Boolean).join("\n\n");

  const productFiles = data.products.map((_, index) => formData.getAll(`product-${index}-images`).filter((entry): entry is File => entry instanceof File && entry.size > 0));
  if (productFiles.some((files, index) => files.length !== data.products[index].imageCount || files.length > MAX_IMAGES_PER_PRODUCT)) {
    return Response.json({ message: "商品画像の件数を確認してください。" }, { status: 400 });
  }

  const validatedFiles: { buffer: Uint8Array; mimeType: string; extension: string; originalName: string }[][] = [];
  try {
    for (const files of productFiles) {
      const entries = [];
      for (const file of files) entries.push({ ...(await validateEstimateImage(file)), originalName: file.name.slice(0, 255) || "image" });
      validatedFiles.push(entries);
    }
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "商品画像を確認できませんでした。" }, { status: 400 });
  }

  let savedEstimateNo: string;
  let savedEstimateId: string;
  try {
    const supabase = createSupabaseClient();
    const { data: saved, error } = await supabase.rpc("create_estimate", {
      p_name: data.customer.name,
      p_company: data.customer.company,
      p_email: data.customer.email,
      p_phone: data.customer.phone,
      p_prefecture: data.customer.prefecture,
      p_shipping_method: data.customer.shipping,
      p_remarks: remarks,
      p_items: data.products.map(({ url, quantity, color, size, model, request, imageCount }) => ({
        url,
        quantity: Number(quantity),
        color,
        size,
        model,
        request,
        image_count: imageCount,
      })),
    });
    if (error || !saved?.[0]?.estimate_no || !saved?.[0]?.estimate_id) throw new Error(error?.message || "見積番号を取得できませんでした。");
    savedEstimateNo = saved[0].estimate_no as string;
    savedEstimateId = saved[0].estimate_id as string;
  } catch (error) {
    console.error("Supabaseへの見積保存に失敗しました。", error);
    return Response.json({ message: "見積内容を保存できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }

  const uploadedPaths: string[] = [];
  const uploadedPathsByProduct: string[][] = data.products.map(() => []);
  try {
    const admin = createSupabaseAdminClient();
    const { data: items, error: itemsError } = await admin.from("estimate_items").select("id, item_index").eq("estimate_id", savedEstimateId).order("item_index");
    if (itemsError || items?.length !== data.products.length) throw new Error(itemsError?.message || "商品情報を確認できませんでした。");
    for (let productIndex = 0; productIndex < validatedFiles.length; productIndex += 1) {
      for (let imageIndex = 0; imageIndex < validatedFiles[productIndex].length; imageIndex += 1) {
        const file = validatedFiles[productIndex][imageIndex];
        const path = `${savedEstimateNo}/${productIndex + 1}/image${imageIndex + 1}.${file.extension}`;
        const { error: uploadError } = await admin.storage.from(ESTIMATE_IMAGE_BUCKET).upload(path, file.buffer, { contentType: file.mimeType, upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        uploadedPathsByProduct[productIndex].push(path);
        const { data: publicUrlData } = admin.storage.from(ESTIMATE_IMAGE_BUCKET).getPublicUrl(path);
        const { error: recordError } = await admin.from("estimate_item_images").insert({ estimate_item_id: items[productIndex].id, storage_path: path, image_url: publicUrlData.publicUrl, original_name: file.originalName, mime_type: file.mimeType, sort_order: imageIndex + 1 });
        if (recordError) throw recordError;
      }
    }
  } catch (error) {
    console.error("見積画像の保存に失敗しました。", error);
    const admin = createSupabaseAdminClient();
    if (uploadedPaths.length) await admin.storage.from(ESTIMATE_IMAGE_BUCKET).remove(uploadedPaths);
    await admin.from("estimates").delete().eq("id", savedEstimateId);
    return Response.json({ message: "商品画像を保存できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }

  if (process.env.ESTIMATE_TEST_MODE === "true") {
    return Response.json({ ok: true, testMode: true, estimateNo: savedEstimateNo });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("RESEND_API_KEY または RESEND_FROM_EMAIL が設定されていません。");
    return Response.json({ message: "メール送信の設定が完了していません。時間をおいて再度お試しください。" }, { status: 503 });
  }

  const receivedAt = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  const imageUrlsByProduct = await Promise.all(uploadedPathsByProduct.map(async (paths) => {
    if (!paths.length) return [];
    const admin = createSupabaseAdminClient();
    const { data: signedImages, error } = await admin.storage.from(ESTIMATE_IMAGE_BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 7);
    if (error) {
      console.error("管理者通知メール用の画像URLを作成できませんでした。", error);
      return [];
    }
    return (signedImages ?? []).flatMap((image) => image.signedUrl ? [image.signedUrl] : []);
  }));

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.batch.send([
      {
        from,
        to: [from],
        replyTo: from,
        subject: `【SK EC Pro】無料見積依頼（${data.customer.name}様）`,
        html: adminEmail(data, receivedAt, imageUrlsByProduct),
      },
      {
        from,
        to: [data.customer.email],
        replyTo: from,
        subject: "【SK EC Pro】無料見積を受け付けました",
        html: replyEmail(data.customer.name),
      },
    ]);

    if (error) throw new Error(error.message);
    return Response.json({ ok: true, estimateNo: savedEstimateNo });
  } catch (error) {
    console.error("Resendでの見積メール送信に失敗しました。", error);
    return Response.json({ message: `見積番号 ${savedEstimateNo} として保存されましたが、メール送信に失敗しました。お問い合わせください。`, saved: true }, { status: 502 });
  }
}
