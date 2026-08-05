"use client";

import { type ActionResult } from "@/lib/actions/action-result";
import { cn } from "@/lib/utils";

export function ActionFeedback({
  result,
  className,
}: {
  result: ActionResult<unknown> | null;
  className?: string;
}) {
  if (!result) return null;

  const errors = result.ok ? [] : Object.values(result.fieldErrors ?? {}).flat();
  return (
    <div
      role={result.ok ? "status" : "alert"}
      className={cn(
        "rounded-lg border p-3 text-sm",
        result.ok
          ? "border-green-500/40 bg-green-500/10"
          : "border-red-500/40 bg-red-500/10",
        className,
      )}
    >
      {result.message && <p>{result.message}</p>}
      {errors.length > 0 && (
        <ul className={result.message ? "mt-2 list-disc pl-5" : "list-disc pl-5"}>
          {errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}
