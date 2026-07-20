"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { yen } from "@/lib/stay/presentation";

type Key="distanceFare"|"highwayFee"|"discountAmount"|"otherFee"|"totalAmount";
export function RidePricingEditor({distanceFare,highwayFee,discountAmount,otherFee,totalAmount,editable}:{distanceFare:number;highwayFee:number;discountAmount:number;otherFee:number;totalAmount:number;editable:boolean}){
  const [amounts,setAmounts]=useState<Record<Key,number>>({distanceFare,highwayFee,discountAmount,otherFee,totalAmount});
  const update=(key:Key,value:string)=>setAmounts(current=>({...current,[key]:Math.max(0,Math.round(Number(value)||0))}));
  const calculate=()=>setAmounts(current=>({...current,totalAmount:Math.max(0,current.distanceFare+current.highwayFee+current.otherFee-current.discountAmount)}));
  return <fieldset className="mt-5 rounded-xl border border-slate-200 p-4" disabled={!editable}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><legend className="font-bold">支払い内訳</legend><p className="mt-1 text-xs text-slate-500">{editable?"未払いのため編集できます。":"支払い処理開始後は編集できません。"}</p></div>{editable&&<Button type="button" variant="outline" onClick={calculate}>計算</Button>}</div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-medium">距離料金<Input name="distanceFare" type="number" min="0" value={amounts.distanceFare} onChange={e=>update("distanceFare",e.target.value)}/></label><label className="text-sm font-medium">高速料金<Input name="highwayFee" type="number" min="0" value={amounts.highwayFee} onChange={e=>update("highwayFee",e.target.value)}/></label><label className="text-sm font-medium">割引金額<Input name="discountAmount" type="number" min="0" value={amounts.discountAmount} onChange={e=>update("discountAmount",e.target.value)}/></label><label className="text-sm font-medium">その他<Input name="otherFee" type="number" min="0" value={amounts.otherFee} onChange={e=>update("otherFee",e.target.value)}/></label></div><label className="mt-4 block text-sm font-bold">合計金額<Input name="totalAmount" type="number" min="0" value={amounts.totalAmount} onChange={e=>update("totalAmount",e.target.value)} className="mt-1 text-lg font-bold"/></label><p className="mt-3 text-right text-xl font-bold text-emerald-700">合計 {yen(amounts.totalAmount)}</p></fieldset>
}
