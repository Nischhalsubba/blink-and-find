/**
 * Tiny className helper.
 * shadcn/ui commonly uses cn() for composable class strings; this keeps the
 * same ergonomics without adding another dependency just to join strings.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
