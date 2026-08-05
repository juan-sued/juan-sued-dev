import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const variants = cva("inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-3 focus-visible:outline-[var(--brand)] disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-[var(--brand)] text-white hover:opacity-90", outline: "border border-[var(--line)] hover:bg-[var(--brand-soft)]", ghost: "hover:bg-[var(--brand-soft)]" } }, defaultVariants: { variant: "default" } });
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, ...props }, ref) { return <button ref={ref} className={cn(variants({ variant }), className)} {...props} />; });
