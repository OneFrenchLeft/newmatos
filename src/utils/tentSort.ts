/**
 * Smart sort for tent identifyingLabel:
 * - Pure numeric strings ("1", "12", "42") come first, sorted numerically ASC
 * - Text labels ("Bourgogne", "Alsace") come after, sorted alphabetically
 * - Direction: "asc" = numbers first asc + alpha asc | "desc" = numbers first desc + alpha desc
 */
export function sortTentLabel(a: string, b: string, direction: "asc" | "desc"): number {
  const aNum = /^\d+$/.test(a.trim())
  const bNum = /^\d+$/.test(b.trim())

  const sign = direction === "asc" ? 1 : -1

  // Both numeric
  if (aNum && bNum) return sign * (parseInt(a) - parseInt(b))

  // Only a is numeric → numbers come first regardless of direction
  if (aNum && !bNum) return -1
  if (!aNum && bNum) return 1

  // Both alpha → locale compare, respecting direction
  return sign * a.localeCompare(b, "fr", { sensitivity: "base" })
}
