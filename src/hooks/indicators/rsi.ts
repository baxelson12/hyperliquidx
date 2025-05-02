import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { rsi } from "indicatorts";

export interface UseRsiConfig {
  period: number;
}

export interface UseRsiReturnValue {
  $current: Signal<number | undefined>;
  $snapshot: Signal<number[]>;
}

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
