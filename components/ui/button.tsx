"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-emerald-600 text-white hover:bg-emerald-700", outline: "border border-slate-200 bg-white hover:bg-slate-50", ghost: "hover:bg-slate-100", destructive: "bg-red-600 text-white hover:bg-red-700" }, size: { default: "px-4 py-2", sm: "min-h-8 rounded-md px-3 text-xs", lg: "min-h-11 px-6" } }, defaultVariants: { variant: "default", size: "default" } });
export function Button({ className, variant, size, asChild = false, children, disabled, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const { pending } = useFormStatus();
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</Slot>;
  }
  const showPending = !asChild && pending && (props.type === "submit" || props.type === undefined);
  return <button className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || showPending} aria-busy={showPending || undefined} {...props}>{showPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{showPending ? "通信中…" : children}</button>;
}
