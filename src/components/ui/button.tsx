import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "ui-button-default",
  secondary: "ui-button-secondary",
  outline: "ui-button-outline",
  ghost: "ui-button-ghost",
  destructive: "ui-button-destructive",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "ui-button-sm",
  md: "ui-button-md",
  lg: "ui-button-lg",
};

/**
 * Bootstrap-compatible shadcn-style button primitive.
 * It keeps native button behavior and uses CSS tokens for the visual system.
 */
export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn("ui-button", variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}
