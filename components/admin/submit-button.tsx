"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingChildren = "Salvando...",
  disabled,
  ...props
}: ButtonProps & { pendingChildren?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button {...props} disabled={pending || disabled}>{pending ? pendingChildren : children}</Button>;
}
