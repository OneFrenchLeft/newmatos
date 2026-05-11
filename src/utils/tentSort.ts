/**
 * Tri alphabétique uniquement — toutes les étiquettes sont des strings.
 * Direction: "asc" = A→Z | "desc" = Z→A
 */
export function sortTentLabel(a: string, b: string, direction: "asc" | "desc"): number {
  const sign = direction === "asc" ? 1 : -1
  return sign * a.localeCompare(b, "fr", { sensitivity: "base", numeric: true })
}
