type ZipCloudResponse = {
  status: number;
  message: string | null;
  results: { address1: string; address2: string; address3: string }[] | null;
};

export async function GET(request: Request) {
  const postalCode = new URL(request.url).searchParams.get("postalCode")?.replace(/\D/g, "") ?? "";
  if (!/^\d{7}$/.test(postalCode)) return Response.json({ message: "郵便番号を7桁で入力してください。" }, { status: 400 });

  try {
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`ZipCloud: ${response.status}`);
    const data = await response.json() as ZipCloudResponse;
    const address = data.results?.[0];
    if (!address) return Response.json({ message: "該当する住所が見つかりませんでした。" }, { status: 404 });
    return Response.json({ prefecture: address.address1, addressLine1: `${address.address2}${address.address3}` });
  } catch (error) {
    console.error("郵便番号から住所を取得できませんでした。", error);
    return Response.json({ message: "住所を検索できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
