import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { atr } from "indicatorts";

/**
 * Configuration object for the `useAtr` hook.
 * @example
 * const atrConfig: UseAtrConfig = {
 * period: 14 // Calculate ATR over a 14-candle period
 * };
 */
export interface UseAtrConfig {
  /** The number of periods (candles) to use for the ATR calculation. */
  period: number;
}

/**
 * Defines the return object structure for the `useAtr` hook.
 * Provides reactive signals for the calculated Average True Range (ATR) values.
 */
export interface UseAtrReturnValue {
  /** Signal<number | undefined>: The most recent ATR value calculated. Undefined if not enough data. */
  $current: Signal<number | undefined>;
  /** Signal<number[]>: An array containing the progressively calculated ATR values. */
  $snapshot: Signal<number[]>;
}

/**
 * Calculates the Average True Range (ATR) indicator reactively based on a signal of candle data.
 * Relies on an external `atr` calculation function that takes high, low, close price arrays and a period.
 *
 * @param $candlesSnapshot - A signal (@preact/signals-core) containing an array of `Candle` objects.
 * Each candle must have `h` (high), `l` (low), and `c` (close) properties.
 * @param config - The `UseAtrConfig` object specifying the calculation `period`.
 * @returns A `UseAtrReturnValue` object containing reactive signals (@preact/signals-core):
 * - `$current`: The latest calculated ATR value.
 * - `$snapshot`: An array of ATR values calculated progressively.
 * @example
 * import { useAtr, type UseAtrConfig, type Candle } from 'hyperliquidx';
 * import { signal, effect } from '@preact/signals-core';
 *
 * // Assume $candlesSnapshot is a signal containing Candle data with h, l, c properties
 * // const $candlesSnapshot: Signal<Candle[]> = signal([...]);
 *
 * const atrConfig: UseAtrConfig = { period: 14 };
 *
 * const { $current, $snapshot } = useAtr($candlesSnapshot, atrConfig);
 *
 * // Example of accessing the reactive state using @preact/signals-core
 * effect(() => {
 * console.log('Current ATR (14):', $current.value);
 * // console.log('ATR Snapshot (14):', $snapshot.value);
 * });
 */
export function useAtr(
  $candlesSnapshot: Signal<Candle[]>,
  config: UseAtrConfig,
): UseAtrReturnValue {
  const $snapshot = computed(() => {
    const values = $candlesSnapshot.value.reduce(
      (acc, curr) => ({
        ...acc,
        h: [...acc.h, +curr.h],
        l: [...acc.l, +curr.l],
        c: [...acc.c, +curr.c],
      }),
      { h: [], l: [], c: [] } as { h: number[]; l: number[]; c: number[] },
    );
    return atr(values.h, values.l, values.c, { ...config }).atrLine;
  });
  const $current = computed(() => $snapshot.value.at(-1));
  return { $snapshot, $current };
}
