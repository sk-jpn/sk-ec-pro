"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
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

function StayDomLocalized({locale,children}:{locale:StayLocale;children:React.ReactNode}){
  const rootRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=rootRef.current;if(!root||locale==="ja")return;
    const translateNode=(rootNode:Node)=>{
      if(rootNode.nodeType===Node.TEXT_NODE){const value=rootNode.nodeValue;if(value){const translated=translateStayText(value,locale);if(translated!==value)rootNode.nodeValue=translated}return}
      if(!(rootNode instanceof Element))return;
      if(rootNode.matches("script,style,[data-stay-no-translate]"))return;
      for(const attribute of ["placeholder","aria-label","title"]){const value=rootNode.getAttribute(attribute);if(value){const translated=translateStayText(value,locale);if(translated!==value)rootNode.setAttribute(attribute,translated)}}
      const walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_TEXT);let textNode=walker.nextNode();while(textNode){const parent=textNode.parentElement;if(parent&&!parent.matches("script,style,[data-stay-no-translate],[data-stay-no-translate] *")){const value=textNode.nodeValue;if(value){const translated=translateStayText(value,locale);if(translated!==value)textNode.nodeValue=translated}}textNode=walker.nextNode()}
      rootNode.querySelectorAll("[placeholder],[aria-label],[title]").forEach((element)=>{if(element.matches("[data-stay-no-translate],[data-stay-no-translate] *"))return;for(const attribute of ["placeholder","aria-label","title"]){const value=element.getAttribute(attribute);if(value){const translated=translateStayText(value,locale);if(translated!==value)element.setAttribute(attribute,translated)}}});
    };
    translateNode(root);
    const observer=new MutationObserver((mutations)=>{for(const mutation of mutations){if(mutation.type==="characterData")translateNode(mutation.target);else mutation.addedNodes.forEach(translateNode)}});
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    return()=>observer.disconnect();
  },[locale]);
  return <div ref={rootRef} className="contents"><StayLocalized>{children}</StayLocalized></div>;
}

export function StayLanguageProvider({locale,children}:{locale:StayLocale;children:React.ReactNode}){return <StayLocaleContext.Provider value={locale}><StayDomLocalized locale={locale}>{children}</StayDomLocalized></StayLocaleContext.Provider>}
export function StayLanguageSwitcher(){const locale=useStayLocale();return <label className="shrink-0"><span className="sr-only">Language</span><select value={locale} onChange={(event)=>{document.cookie=`stay_locale=${event.target.value}; Path=/; Max-Age=31536000; SameSite=Lax`;window.location.reload()}} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium" aria-label="Language">{stayLocales.map(value=><option value={value} key={value}>{stayLocaleLabels[value]}</option>)}</select></label>}
