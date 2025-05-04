import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { dema } from "indicatorts";

/**
 * Configuration object for the `useDema` hook.
 * @example
 * const demaConfig: UseDemaConfig = {
 * period: 9 // Calculate DEMA over a 9-candle period
 * };
 */
export interface UseDemaConfig {
  /** The number of periods (candles) to use for the DEMA calculation. */
  period: number;
}

/**
 * Defines the return object structure for the `useDema` hook.
 * Provides reactive signals for the calculated Double Exponential Moving Average (DEMA) values.
 */
export interface UseDemaReturnValue {
  /** Signal<number | undefined>: The most recent DEMA value calculated. Undefined if not enough data. */
  $current: Signal<number | undefined>;
  /** Signal<number[]>: An array containing the progressively calculated DEMA values. */
  $snapshot: Signal<number[]>;
}

/**
 * Calculates the Double Exponential Moving Average (DEMA) indicator reactively
 * based on candle close prices from a signal of candle data.
 * Relies on an external `dema` calculation function.
 *
 * @param $candlesSnapshot - A signal (@preact/signals-core) containing an array of `Candle` objects.
 * Each candle must have a `c` (close) property.
 * @param config - The `UseDemaConfig` object specifying the calculation `period`.
 * @returns A `UseDemaReturnValue` object containing reactive signals (@preact/signals-core):
 * - `$current`: The latest calculated DEMA value.
 * - `$snapshot`: An array of DEMA values calculated progressively.
 * @example
 * import { useDema, type UseDemaConfig, type Candle } from 'hyperliquidx';
 * import { signal, effect } from '@preact/signals-core';
 *
 * // Assume $candlesSnapshot is a signal containing Candle data with 'c' property
 * // const $candlesSnapshot: Signal<Candle[]> = signal([...]);
 *
 * const demaConfig: UseDemaConfig = { period: 9 };
 *
 * const { $current, $snapshot } = useDema($candlesSnapshot, demaConfig);
 *
 * // Example of accessing the reactive state using @preact/signals-core
 * effect(() => {
 * console.log('Current DEMA (9):', $current.value);
 * // console.log('DEMA Snapshot (9):', $snapshot.value);
 * });
 */
export function useDema(
  $candlesSnapshot: Signal<Candle[]>,
  config: UseDemaConfig,
): UseDemaReturnValue {
  const $snapshot = computed(() =>
    dema(
      $candlesSnapshot.value.map(({ c }) => +c),
      { ...config },
    ),
  );
  const $current = computed(() => $snapshot.value.at(-1));
  return { $snapshot, $current };
}
