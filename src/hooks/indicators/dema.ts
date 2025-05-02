import type { Candle } from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import { dema } from "indicatorts";

export interface UseDemaConfig {
  period: number;
}

export interface UseDemaReturnValue {
  $current: Signal<number | undefined>;
  $snapshot: Signal<number[]>;
}

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
