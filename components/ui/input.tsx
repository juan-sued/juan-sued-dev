import { cn } from "@/lib/utils";
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("min-h-11 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 text-[var(--ink)]", className)} {...props}/>; }
