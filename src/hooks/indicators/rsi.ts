import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { rsi } from "indicatorts";

/**
 * Configuration object for the `useRsi` hook.
 * @example
 * const rsiConfig: UseRsiConfig = {
 * period: 14 // Calculate RSI over a 14-candle period
 * };
 */
export interface UseRsiConfig {
  /** The number of periods (candles) to use for the RSI calculation. */
  period: number;
}

/**
 * Defines the return object structure for the `useRsi` hook.
 * Provides reactive signals for the calculated Relative Strength Index (RSI) values.
 */
export interface UseRsiReturnValue {
  /** Signal<number | undefined>: The most recent RSI value calculated. Undefined if not enough data. */
  $current: Signal<number | undefined>;
  /** Signal<number[]>: An array containing the progressively calculated RSI values. */
  $snapshot: Signal<number[]>;
}

/**
 * Calculates the Relative Strength Index (RSI) indicator reactively
 * based on candle close prices from a signal of candle data.
 * Relies on an external `rsi` calculation function.
 *
 * @param $candlesSnapshot - A signal (@preact/signals-core) containing an array of `Candle` objects.
 * Each candle must have a `c` (close) property.
 * @param config - The `UseRsiConfig` object specifying the calculation `period`.
 * @returns A `UseRsiReturnValue` object containing reactive signals (@preact/signals-core):
 * - `$current`: The latest calculated RSI value.
 * - `$snapshot`: An array of RSI values calculated progressively.
 * @example
 * import { useRsi, type UseRsiConfig, type Candle } from 'hyperliquidx';
 * import { signal, effect } from '@preact/signals-core';
 *
 * // Assume $candlesSnapshot is a signal containing Candle data with 'c' property
 * // const $candlesSnapshot: Signal<Candle[]> = signal([...]);
 *
 * const rsiConfig: UseRsiConfig = { period: 14 };
 *
 * const { $current, $snapshot } = useRsi($candlesSnapshot, rsiConfig);
 *
 * // Example of accessing the reactive state using @preact/signals-core
 * effect(() => {
 * console.log('Current RSI (14):', $current.value);
 * // console.log('RSI Snapshot (14):', $snapshot.value);
 * });
 */
export function useRsi(
  $candlesSnapshot: Signal<Candle[]>,
  config: UseRsiConfig,
): UseRsiReturnValue {
  const $snapshot = computed(() =>
    rsi(
      $candlesSnapshot.value.map(({ c }) => +c),
      { ...config },
    ),
  );
  const $current = computed(() => $snapshot.value.at(-1));
  return { $snapshot, $current };
}
