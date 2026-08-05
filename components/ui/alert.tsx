import { cn } from "@/lib/utils";
export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div role="alert" className={cn("rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm", className)} {...props}/>; }
