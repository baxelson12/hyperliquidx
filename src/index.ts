/**
 * Greets a user with given 'name'.
 *
 * @param name The user's name
 * @returns void
 * @example
 * ```typescript
 * import { greet } from 'hyperliquidx';
 *
 * // Will log 'Hello, Jimmy!'
 * greet("Jimmy");
 * @remarks This is just a test function to ensure everything works properly.
 */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
