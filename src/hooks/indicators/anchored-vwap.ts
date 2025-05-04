import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { vwap } from "indicatorts";

/**
 * Defines the possible time periods to anchor the start of a VWAP calculation.
 * - `session`: Uses all available candle data provided.
 * - `week`: Anchors to the start of the current week (Monday 00:00).
 * - `month`: Anchors to the start of the current month (1st day 00:00).
 * - `year`: Anchors to the start of the current year (January 1st 00:00).
 * (Note: Week/Month/Year anchors are based on the local time of the execution environment)
 */
type VwapAnchor = "session" | "week" | "month" | "year";

/**
 * Configuration object for the `useAnchoredVwap` hook.
 * @example
 * const vwapConfig: UseAnchoredVwapConfig = {
 * anchor: 'week' // Calculate VWAP starting from the beginning of this week
 * };
 */
export interface UseAnchoredVwapConfig {
  /** Specifies the time anchor for the VWAP calculation start point. */
  anchor: VwapAnchor;
}

/**
 * Defines the return object structure for the `useAnchoredVwap` hook.
 * Provides reactive signals for the calculated VWAP values.
 */
export interface UseAnchoredVwapReturnValue {
  /** Signal<number | undefined>: The most recent VWAP value calculated over the anchored period. Undefined if no data. */
  $current: Signal<number | undefined>;
  /** Signal<number[]>: An array containing the progressively calculated VWAP values for each candle within the anchored period. */
  $snapshot: Signal<number[]>;
}

const getFilterStartTime: (anchor: VwapAnchor) => number = (
  anchor: VwapAnchor,
) => {
  let filterStartTime = 0; // Default to beginning of epoch if needed, but session handles it

  if (anchor !== "session") {
    const now = new Date(); // Use current time for anchoring calculations
    const startDate = new Date(now); // Copy current date to modify

    switch (anchor) {
      case "week": {
        const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Calculate days to subtract to get to the previous Monday
        // If Sunday (0), subtract 6 days. If Monday (1), subtract 0. If Tuesday (2), subtract 1, etc.
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0); // Set to midnight start of the day
        filterStartTime = startDate.getTime();
        break;
      }
      case "month": {
        // Set to the first day of the current month, midnight
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        filterStartTime = startDate.getTime();
        break;
      }
      case "year": {
        // Set to the first day of the current year (Month 0 = January), midnight
        startDate.setMonth(0, 1); // Set month to January, day to 1st
        startDate.setHours(0, 0, 0, 0);
        filterStartTime = startDate.getTime();
        break;
      }
      // case 'session': // No start time needed, handled below
    }
  }

  return filterStartTime;
};

/**
 * Calculates the Volume Weighted Average Price (VWAP) reactively based on a signal of candle data.
 * The calculation can be anchored to the start of the current session, week, month, or year.
 * Relies on an external `vwap` calculation function.
 *
 * @param $candlesSnapshot - A signal (@preact/signals-core) containing an array of `Candle` objects.
 * Each candle should have `T` (timestamp), `c` (close/typical price), and `v` (volume).
 * @param config - The `UseAnchoredVwapConfig` object specifying the `anchor` period.
 * @returns A `UseAnchoredVwapReturnValue` object containing reactive signals (@preact/signals-core):
 * - `$current`: The latest calculated VWAP value for the anchored period.
 * - `$snapshot`: An array of VWAP values calculated progressively over the anchored period.
 * @example
 * import { useAnchoredVwap, type UseAnchoredVwapConfig, type Candle } from 'hyperliquidx';
 * import { signal, effect } from '@preact/signals-core';
 *
 * // Assume $candlesSnapshot is a signal containing Candle data
 * // const $candlesSnapshot: Signal<Candle[]> = signal([...]);
 *
 * const vwapConfig: UseAnchoredVwapConfig = { anchor: 'month' };
 *
 * const { $current, $snapshot } = useAnchoredVwap($candlesSnapshot, vwapConfig);
 *
 * // Example of accessing the reactive state using @preact/signals-core
 * effect(() => {
 * console.log('Current Anchored VWAP (Month):', $current.value);
 * // console.log('VWAP Snapshot (Month):', $snapshot.value);
 * });
 */
export function useAnchoredVwap(
  $candlesSnapshot: Signal<Candle[]>,
  { anchor }: UseAnchoredVwapConfig,
): UseAnchoredVwapReturnValue {
  const $subset = computed(() =>
    anchor === "session"
      ? $candlesSnapshot.value
      : $candlesSnapshot.value.filter(
          ({ T }) => T >= getFilterStartTime(anchor),
        ),
  );
  const $snapshot = computed(() => {
    const values = $subset.value.reduce(
      (acc, curr) => ({
        ...acc,
        c: [...acc.c, +curr.c],
        v: [...acc.v, +curr.v],
      }),
      { c: [], v: [] } as { c: number[]; v: number[] },
    );
    return vwap(values.c, values.v, { period: values.c.length });
  });
  const $current = computed(() => $snapshot.value.at(-1));
  return { $snapshot, $current };
}
