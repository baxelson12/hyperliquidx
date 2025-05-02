/**
 * Rounds a number to a specified precision.
 *
 * @param number The number to round.
 * @param precision The number of decimal places to round to. Defaults to 0.
 * @returns The rounded number.
 */
export function round(number: number, precision = 0): number {
  const multiplier = 10 ** Math.abs(precision);
  const rounded = Math.round(number * multiplier) / multiplier;

  return precision < 0
    ? Math.round(rounded * multiplier) / multiplier
    : rounded;
}
