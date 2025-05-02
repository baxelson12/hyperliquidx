import type {
  Candle,
  CandleSnapshotParameters,
  EventCandleParameters,
  EventClient,
  HttpTransport,
  PublicClient,
  WebSocketTransport,
} from "@nktkas/hyperliquid";
import { computed, type Signal, signal } from "@preact/signals-core";
import { definedEffect } from "src/utils/defined-effect";
import { createResource } from "src/utils/resource";

/* The return value for useCandlesCurrent hook. */
export interface UseCandlesCurrentReturnValue {
  /* Current candle data */
  $current: Signal<Candle | undefined>;
  /* Unsubscribe from websocket. */
  dispose: () => void;
}

/* The return value for useCandlesSnapshot hook. */
export interface UseCandlesSnapshotReturnValue {
  /* Snapshot candle data */
  $snapshot: Signal<Candle[]>;
  /* Unsubscribe from inner effect */
  dispose: () => void;
}

/* The return value for useCandlesLast hook. */
export interface UseCandlesLastReturnValue {
  /* Most recently closed candle */
  $last: Signal<Candle | undefined>;
}

/**
 * Subscribes to candle websocket and updates when new candle data received.
 * @param eventClient The sdk eventClient class.
 * @param config The sdk EventCandleParameters config.
 * @returns A reactive signal '$current' and 'dispose' to clean up the websocket connection.
 * @example
 * ```typescript
 * const { $current, dispose } = useCandlesCurrent(client, { coin: "ETH", interval: "1m" })
 * const closingPrice = $current.c ?? '0'
 * dispose()
 * ```
 */
export function useCandlesCurrent(
  eventClient: EventClient<WebSocketTransport>,
  config: EventCandleParameters,
): UseCandlesCurrentReturnValue {
  const $current = signal<Candle | undefined>(undefined);
  const unsubscribe = eventClient.candle(
    config,
    (candle) => ($current.value = { ...candle }),
  );

  return {
    $current,
    dispose: () => unsubscribe.then((u) => u.unsubscribe()),
  };
}

/**
 * Holds a snapshot of defined length and maintains current data until disposed.  Fetches initial values if necessary.
 * @param $current Signal for the current candle data.
 * @param publicClient The sdk publicClient class.
 * @param config The sdk CandleSnapshotParameters config.
 * @returns A reactive signal '$snapshot' and 'dispose' to clean up the websocket connection.
 * @example
 * ```typescript
 * const { $current, dispose: disposeCurrent } = useCandlesCurrent(eventClient, { coin: "ETH", interval: "1m" })
 * const { $snapshot, dispose: disposeSnapshot } = useCandlesSnapshot($current, publicClient, { coin: "ETH", interval: "1m", startTime: Date.now() - 1000 * 60 * 60 * (24 * 7) }) // 7 day snapshot
 *
 * disposeCurrent();
 * disposeSnapshot();
 * ```
 */
export function useCandlesSnapshot(
  $current: Signal<Candle | undefined>,
  publicClient: PublicClient<HttpTransport>,
  config: CandleSnapshotParameters,
): UseCandlesSnapshotReturnValue {
  let size = 0;
  const snapshotResource = createResource(
    () => config,
    async (conf): Promise<Candle[]> => await publicClient.candleSnapshot(conf),
  );
  // Store initial data
  const $snapshot = signal<Candle[]>([]);
  // Once data is loaded, update snapshot
  const _ = definedEffect(
    ({ data }) => {
      const _snapshot = $snapshot.peek();
      // We don't need this anymore if snapshot is populated
      if (_snapshot.length) {
        _();
        return;
      }
      if (!_snapshot.length && data) {
        size = data.length;
        $snapshot.value = [...data];
      }
    },
    [snapshotResource.state],
  );
  // Monitor incoming data
  const dispose = definedEffect(
    (current) => {
      const _snapshot = $snapshot.peek();

      // Don't proceed if there's no initial data
      if (!_snapshot.length) {
        return;
      }

      // Candle has not yet closed
      if (_snapshot.at(-1)?.T === current.T) {
        $snapshot.value = [..._snapshot.slice(0, -1), { ...current }];
      }
      // Candle has closed
      else {
        _snapshot.push({ ...current });
        _snapshot.length > size && _snapshot.shift();
        $snapshot.value = [..._snapshot];
      }
    },
    [$current],
  );

  return { $snapshot, dispose };
}

/**
 * Derived signal which returns the -most recently- closed candle
 * @param $snapshot Signal for the snapshot candle data.
 * @returns A reactive signal '$last'
 * @example
 * ```typescript
 * const { $current, dispose: disposeCurrent } = useCandlesCurrent(eventClient, { coin: "ETH", interval: "1m" })
 * const { $snapshot, dispose: disposeSnapshot } = useCandlesSnapshot($current, publicClient, { coin: "ETH", interval: "1m", startTime: Date.now() - 1000 * 60 * 60 * (24 * 7) }) // 7 day snapshot
 * const { $last } = useCandlesLast($snapshot)
 *
 * disposeCurrent();
 * disposeSnapshot();

 * ```
 */
export function useCandlesLast(
  $snapshot: Signal<Candle[]>,
): UseCandlesLastReturnValue {
  const $last = computed(() => $snapshot.value.at(-2));
  return { $last };
}
