"use client";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withBasePath } from "@/config/site";
import { StayLocalized, useStayLocale } from "@/app/stay/stay-language";
import { createRideBooking } from "../actions";
import { getFixedRoutes, getTranslatedFixedRouteLabel } from "@/lib/stay/ride-fixed-routes";

type StayOption = { id: string; code:string; label: string };
type Quote = { distanceMeters: number; durationSeconds: number; meterFare: number; discountPercent: number; discountAmount: number; totalAmount: number; isNight: boolean };
const weekdays = { ja:["日","月","火","水","木","金","土"], en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], zh:["日","一","二","三","四","五","六"], ko:["일","월","화","수","목","금","토"] } as const;
function moveMonth(month:string, offset:number){const [y,m]=month.split("-").map(Number),d=new Date(Date.UTC(y,m-1+offset,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}`}
function days(month:string){const [y,m]=month.split("-").map(Number),count=new Date(Date.UTC(y,m,0)).getUTCDate(),leading=new Date(Date.UTC(y,m-1,1)).getUTCDay(),cells=Math.ceil((leading+count)/7)*7;return Array.from({length:cells},(_,i)=>{const day=i-leading+1;return day<1||day>count?null:{day,date:`${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`}})}
const yen = (amount:number) => new Intl.NumberFormat("ja-JP", { style:"currency", currency:"JPY", maximumFractionDigits:0 }).format(amount);

export function RideBookingForm({ today, monthEnd, stays, discountPercent }: { today:string; monthEnd:string; stays:StayOption[]; discountPercent:number }) {
  const locale=useStayLocale(),[month,setMonth]=useState(today.slice(0,7)),[rideDate,setRideDate]=useState(""),[departureTime,setDepartureTime]=useState(""),[stayId,setStayId]=useState(""),[pickup,setPickup]=useState(""),[destination,setDestination]=useState(""),[fixedRouteId,setFixedRouteId]=useState(""),[quote,setQuote]=useState<Quote|null>(null),[quoting,setQuoting]=useState(false),[error,setError]=useState("");
  const selectedRoomCode=stays.find(stay=>stay.id===stayId)?.code??"",fixedRoutes=getFixedRoutes(selectedRoomCode),hasRoom=selectedRoomCode.length>0;
  const calendar=useMemo(()=>days(month),[month]);

  function selectStay(id:string){
    setStayId(id);
    setFixedRouteId("");
    setQuote(null);
    setPickup("");
    setDestination("");
  }

  function selectFixedRoute(routeId:string){
    setFixedRouteId(routeId);
    const route=fixedRoutes.find(r=>r.id===routeId);
    if(route){
      setPickup(route.pickup);
      setDestination(route.destination);
      setQuote({distanceMeters:0,durationSeconds:0,meterFare:route.price,discountPercent:0,discountAmount:0,totalAmount:route.price,isNight:false});
    }
    setError("");
  }

  async function estimate(){setQuoting(true);setError("");try{const response=await fetch(withBasePath("/api/stay/rides/quote"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({departureTime,pickupAddress:pickup,destinationAddress:destination})});const result=await response.json();if(!response.ok)throw new Error(result.message);setQuote(result)}catch(e){setQuote(null);setError(e instanceof Error?e.message:"見積を取得できませんでした。")}finally{setQuoting(false)}}

  const canSubmit=Boolean(rideDate&&departureTime&&quote);
  const isPickupReadOnly=fixedRouteId.length>0;
  const canEstimate=!fixedRouteId&&Boolean(rideDate&&departureTime&&pickup.length>=2&&destination.length>=2);

  return <StayLocalized><form action={createRideBooking} className="mt-6 space-y-7">
    <section className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm sm:p-6"><div className="flex items-center gap-2"><CalendarDays className="size-5 text-emerald-600"/><h2 className="text-lg font-bold">1. 配車日を選択</h2></div><div className="my-5 flex items-center justify-between"><Button type="button" variant="outline" size="sm" onClick={()=>setMonth(moveMonth(month,-1))} disabled={month<=today.slice(0,7)} aria-label="前月"><ChevronLeft/></Button><p className="text-xl font-bold">{new Intl.DateTimeFormat(locale,{year:"numeric",month:"long",timeZone:"UTC"}).format(new Date(`${month}-01T00:00:00Z`))}</p><Button type="button" variant="outline" size="sm" onClick={()=>setMonth(moveMonth(month,1))} disabled={moveMonth(month,1)>monthEnd} aria-label="翌月"><ChevronRight/></Button></div><div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200">{weekdays[locale].map((d,i)=><div key={d} className={`border-b bg-slate-50 py-2 text-center text-xs font-bold ${i===0?"text-red-500":i===6?"text-blue-500":"text-slate-500"}`}>{d}</div>)}{calendar.map((entry,index)=>entry?<button type="button" key={entry.date} disabled={entry.date<today} onClick={()=>{setRideDate(entry.date);setQuote(null)}} className={`min-h-20 border-b border-r p-2 text-left sm:min-h-28 sm:p-3 ${rideDate===entry.date?"bg-blue-100 ring-2 ring-inset ring-blue-500":entry.date<today?"bg-slate-50 text-slate-300":"bg-emerald-50/40 hover:bg-emerald-100"}`}><span className="font-bold">{entry.day}</span>{rideDate===entry.date&&<p className="mt-2 rounded bg-blue-600 py-1 text-center text-xs font-bold text-white">選択中</p>}</button>:<div key={`empty-${index}`} className="min-h-20 border-b border-r bg-slate-50/60 sm:min-h-28"/>)}</div><input type="hidden" name="rideDate" value={rideDate}/>{rideDate&&<p className="mt-4 font-bold text-blue-700">選択日：{rideDate}</p>}</section>
    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><MapPin className="size-5 text-emerald-600"/><h2 className="text-lg font-bold">2. 出発情報を入力</h2></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">出発時間<span className="text-red-500"> *</span><Input name="departureTime" type="time" required value={departureTime} onChange={e=>{setDepartureTime(e.target.value);setQuote(null)}}/></label><label className="text-sm font-medium">滞在中の部屋（任意）<select name="stayBookingId" value={stayId} onChange={e=>selectStay(e.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3"><option value="">選択しない</option>{stays.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
      {hasRoom&&<div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold text-blue-900">定額ルート</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{fixedRoutes.map(route=><div key={route.id} className="rounded-lg bg-white p-3"><p className="text-sm font-bold">{getTranslatedFixedRouteLabel(route, locale)}</p><div className="mt-2"><button type="button" onClick={()=>selectFixedRoute(route.id)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${fixedRouteId===route.id?"bg-blue-600 text-white":"border border-slate-200 hover:border-blue-300"}`}>{yen(route.price)}</button></div></div>)}</div></div>}
      <input type="hidden" name="fixedRouteId" value={fixedRouteId}/>
      <div className="mt-5 grid gap-5">
        <label className="text-sm font-medium">出発場所<span className="text-red-500"> *</span>
          <Input name="pickupAddress" required value={pickup} readOnly={isPickupReadOnly}
            onChange={e=>{if(!fixedRouteId){setPickup(e.target.value);setQuote(null)}}}
            className={isPickupReadOnly?"bg-slate-100":"bg-white"}
            placeholder="例：東京都江戸川区東葛西4-43-5"/>
        </label>
        <label className="text-sm font-medium">到着場所<span className="text-red-500"> *</span>
          <Input name="destinationAddress" required value={destination} readOnly={isPickupReadOnly}
            onChange={e=>{if(!fixedRouteId){setDestination(e.target.value);setQuote(null)}}}
            className={isPickupReadOnly?"bg-slate-100":"bg-white"}
            placeholder="例：羽田空港 第3ターミナル"/>
        </label>
      </div>
      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-600">初乗り1km 500円、以後232mごとに100円。22:00〜5:00は距離短縮方式で2割増、算出運賃から{discountPercent}%割引します。</p>
        {!fixedRouteId&&<Button type="button" className="mt-4" onClick={estimate} disabled={!canEstimate||quoting}>
          {quoting&&<LoaderCircle className="size-4 animate-spin"/>}{quoting?"見積中…":"自動見積する"}
        </Button>}
        {error&&<p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        {quote&&<div className="mt-4 grid gap-2 rounded-xl border border-emerald-200 bg-white p-4 text-sm">
          {!fixedRouteId&&<><p>走行距離：約{(quote.distanceMeters/1000).toFixed(1)}km</p><p>通常メーター運賃：{yen(quote.meterFare)}{quote.isNight&&"（深夜・早朝）"}</p><p>割引：-{yen(quote.discountAmount)}（{quote.discountPercent}%）</p></>}
          <p className="text-xl font-bold text-emerald-700">見積合計：{yen(quote.totalAmount)}</p>
          {!fixedRouteId&&<p className="text-xs text-slate-500">道路状況や経路変更により実際の料金が変わる場合があります。高速料金は別途かかります。</p>}
        </div>}
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={!canSubmit}>この内容で配車予約する</Button>
    </section>
  </form></StayLocalized>;
}