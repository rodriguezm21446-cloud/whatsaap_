export function maskWhatsappId(value: string): string {
  if (value.length <= 6) return "***";
  return `+${value.slice(0, 3)} ${value.slice(3, 5)} *** **${value.slice(-2)}`;
}

