export const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;

export function parseMoney(value: unknown, allowZero = false): string | null {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!MONEY_PATTERN.test(text)) return null;
  if (!allowZero && /^0(?:\.0{1,3})?$/.test(text)) return null;
  return text;
}

export function convertMoneySql(column: string, currencyColumn: string): string {
  return `(CASE WHEN ${currencyColumn} = 'USD' THEN ${column} * 7.68::numeric ELSE ${column} END)`;
}