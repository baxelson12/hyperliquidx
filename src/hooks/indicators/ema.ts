import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { ema } from "indicatorts";

export interface UseEmaConfig {
  period: number;
}

export interface UseEmaReturnValue {
  $current: Signal<number | undefined>;
  $snapshot: Signal<number[]>;
}

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
