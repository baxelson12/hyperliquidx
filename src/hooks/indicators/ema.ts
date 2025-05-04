import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { ema } from "indicatorts";

/**
 * Configuration object for the `useEma` hook.
 * @example
 * const emaConfig: UseEmaConfig = {
 * period: 12 // Calculate EMA over a 12-candle period
 * };
 */
export interface UseEmaConfig {
  /** The number of periods (candles) to use for the EMA calculation. */
  period: number;
}

/**
 * Defines the return object structure for the `useEma` hook.
 * Provides reactive signals for the calculated Exponential Moving Average (EMA) values.
 */
export interface UseEmaReturnValue {
  /** Signal<number | undefined>: The most recent EMA value calculated. Undefined if not enough data. */
  $current: Signal<number | undefined>;
  /** Signal<number[]>: An array containing the progressively calculated EMA values. */
  $snapshot: Signal<number[]>;
}

/**
 * Calculates the Exponential Moving Average (EMA) indicator reactively
 * based on candle close prices from a signal of candle data.
 * Relies on an external `ema` calculation function.
 *
 * @param $candlesSnapshot - A signal (@preact/signals-core) containing an array of `Candle` objects.
 * Each candle must have a `c` (close) property.
 * @param config - The `UseEmaConfig` object specifying the calculation `period`.
 * @returns A `UseEmaReturnValue` object containing reactive signals (@preact/signals-core):
 * - `$current`: The latest calculated EMA value.
 * - `$snapshot`: An array of EMA values calculated progressively.
 * @example
 * import { useEma, type UseEmaConfig, type Candle } from 'hyperliquidx';
 * import { signal, effect } from '@preact/signals-core';
 *
 * // Assume $candlesSnapshot is a signal containing Candle data with 'c' property
 * // const $candlesSnapshot: Signal<Candle[]> = signal([...]);
 *
 * const emaConfig: UseEmaConfig = { period: 12 };
 *
 * const { $current, $snapshot } = useEma($candlesSnapshot, emaConfig);
 *
 * // Example of accessing the reactive state using @preact/signals-core
 * effect(() => {
 * console.log('Current EMA (12):', $current.value);
 * // console.log('EMA Snapshot (12):', $snapshot.value);
 * });
 */
export function useEma(
  $candlesSnapshot: Signal<Candle[]>,
  config: UseEmaConfig,
): UseEmaReturnValue {
  const $snapshot = computed(() =>
    ema(
      $candlesSnapshot.value.map(({ c }) => +c),
      { ...config },
    ),
  );
  const $current = computed(() => $snapshot.value.at(-1));
  return { $snapshot, $current };
}
