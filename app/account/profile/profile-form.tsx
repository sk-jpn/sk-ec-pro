"use client";
import { useActionState, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, type ProfileState } from "./actions";

const initial: ProfileState = { success: false, message: "" };
const PREFECTURES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"] as const;
type Profile = { full_name: string; email: string; phone: string | null; postal_code: string | null; prefecture: string | null; address_line1: string | null; address_line2: string | null; deposit_balance: number };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const [postalCode, setPostalCode] = useState(profile.postal_code ?? "");
  const [prefecture, setPrefecture] = useState(profile.prefecture ?? "");
  const [addressLine1, setAddressLine1] = useState(profile.address_line1 ?? "");
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  async function lookupAddress() {
    const normalized = postalCode.replace(/\D/g, "");
    if (!/^\d{7}$/.test(normalized)) { setLookupMessage("郵便番号を7桁で入力してください。"); return; }
    setLookingUp(true); setLookupMessage("");
    try {
      const response = await fetch(`/ec/api/postal-code?postalCode=${normalized}`);
      const data = await response.json() as { prefecture?: string; addressLine1?: string; message?: string };
      if (!response.ok || !data.prefecture || !data.addressLine1) throw new Error(data.message || "住所を取得できませんでした。");
      setPostalCode(`${normalized.slice(0, 3)}-${normalized.slice(3)}`);
      setPrefecture(data.prefecture);
      setAddressLine1(data.addressLine1);
      setLookupMessage("住所を自動入力しました。番地以降を追記してください。");
    } catch (error) { setLookupMessage(error instanceof Error ? error.message : "住所を取得できませんでした。"); }
    finally { setLookingUp(false); }
  }

  return <form action={action} className="space-y-5">
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Deposit</p><p className="mt-2 text-2xl font-bold text-blue-950">¥{new Intl.NumberFormat("ja-JP").format(profile.deposit_balance)}</p><p className="mt-2 text-xs leading-5 text-blue-700">デポジット残高は管理者が更新します。マイページからは編集できません。</p></div>
    <Field label="氏名" name="fullName" defaultValue={profile.full_name} required />
    <Field label="メールアドレス" name="email" defaultValue={profile.email} type="email" required hint="連絡先メールアドレスです。Googleログインに使用するメールアドレスは変更されません。" />
    <div className="grid gap-5 sm:grid-cols-2"><Field label="電話番号" name="phone" defaultValue={profile.phone ?? ""} type="tel" required /><label className="block"><span className="mb-2 block text-sm font-semibold">郵便番号</span><div className="flex gap-2"><Input name="postalCode" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} inputMode="numeric" autoComplete="postal-code" placeholder="123-4567" maxLength={8} required /><Button type="button" variant="outline" onClick={lookupAddress} disabled={lookingUp || pending} className="shrink-0"><MapPin size={16} />{lookingUp ? "検索中…" : "住所自動入力"}</Button></div>{lookupMessage && <span className={`mt-2 block text-xs ${lookupMessage.startsWith("住所を自動") ? "text-emerald-600" : "text-red-600"}`}>{lookupMessage}</span>}</label></div>
    <label className="block"><span className="mb-2 block text-sm font-semibold">都道府県</span><select name="prefecture" value={prefecture} onChange={(event) => setPrefecture(event.target.value)} required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"><option value="">選択してください</option>{PREFECTURES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold">お届け先住所</span><Input name="addressLine1" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} autoComplete="address-line1" required /><span className="mt-1 block text-xs text-slate-400">自動入力後、番地まで入力してください。</span></label>
    <Field label="建物名・部屋番号" name="addressLine2" defaultValue={profile.address_line2 ?? ""} autoComplete="address-line2" />
    {state.message && <p role="status" className={`rounded-lg px-4 py-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p>}
    <Button type="submit" size="lg" disabled={pending}>{pending ? "保存中…" : "プロフィールを保存"}</Button>
  </form>;
}

function Field({ label, hint, ...props }: React.ComponentProps<typeof Input> & { label: string; hint?: string }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><Input {...props} />{hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}</label>; }
