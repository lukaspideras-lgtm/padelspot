/** Validira broj telefona: +3816..., 06..., 064... itd. */
export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 9;
}

/** Normalizuje broj – samo cifre, za upoređivanje jedinstvenosti */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
