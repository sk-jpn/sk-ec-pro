"use client";

import React, { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { stayLocaleLabels, stayLocales, translateStayText, type StayLocale } from "@/lib/stay/i18n";

const StayLocaleContext=createContext<StayLocale>("ja");
export const useStayLocale=()=>useContext(StayLocaleContext);

function localize(node:React.ReactNode,locale:StayLocale):React.ReactNode{
  if(typeof node==="string")return translateStayText(node,locale);
  if(Array.isArray(node))return node.map((child,index)=><React.Fragment key={index}>{localize(child,locale)}</React.Fragment>);
  if(!React.isValidElement(node))return node;
  const element=node as React.ReactElement<Record<string,unknown>>;const props={...element.props};
  if("children" in props)props.children=localize(props.children as React.ReactNode,locale);
  for(const key of ["placeholder","aria-label","title"] as const)if(typeof props[key]==="string")props[key]=translateStayText(props[key] as string,locale);
  return React.cloneElement(element,props);
}

export function StayLocalized({children}:{children:React.ReactNode}){const locale=useStayLocale();return <>{localize(children,locale)}</>}
export function StayLanguageProvider({locale,children}:{locale:StayLocale;children:React.ReactNode}){return <StayLocaleContext.Provider value={locale}><StayLocalized>{children}</StayLocalized></StayLocaleContext.Provider>}
export function StayLanguageSwitcher(){const locale=useStayLocale();const router=useRouter();return <label className="shrink-0"><span className="sr-only">Language</span><select value={locale} onChange={(event)=>{document.cookie=`stay_locale=${event.target.value}; Path=/; Max-Age=31536000; SameSite=Lax`;router.refresh()}} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium" aria-label="Language">{stayLocales.map(value=><option value={value} key={value}>{stayLocaleLabels[value]}</option>)}</select></label>}
