import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { atr } from "indicatorts";

export interface UseAtrConfig {
  period: number;
}

export interface UseAtrReturnValue {
  $current: Signal<number | undefined>;
  $snapshot: Signal<number[]>;
}

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
