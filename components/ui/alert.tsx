import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: React.ComponentProps<"div">) { return <div role="alert" className={cn("relative w-full rounded-lg border border-slate-200 bg-white p-4 text-sm", className)} {...props} />; }
export function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) { return <h5 className={cn("mb-1 font-semibold leading-none", className)} {...props} />; }
export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("text-sm leading-6 text-slate-600", className)} {...props} />; }
