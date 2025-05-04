import type {
  EventClient,
  WebSocketTransport,
  WsAllMids,
} from "@nktkas/hyperliquid";
import { signal, type Signal } from "@preact/signals-core";

/* The return value for the useMidPrice hook. */
export interface UseMidPriceReturnValue {
  /* The current mid/mark price */
  $mid: Signal<number | undefined>;
  /* Unsubscribe from websocket */
  dispose: () => void;
}

/**
 * Subscribes to the `allMids` websocket stream via the EventClient to receive
 * the mid-price (often the mark price) for a specific coin reactively.
 * Throws an error if the configured coin is not found in the received data.
 * Remember to call `dispose` when finished.
 *
 * @param eventClient - An initialized Hyperliquid EventClient instance.
 * @param config - Configuration object specifying the coin.
 * @param config.coin - The string identifier (e.g., "ETH", "BTC") of the coin whose mid-price is needed.
 * @returns A `UseMidPriceReturnValue` object containing the reactive `$mid` signal and the `dispose` function.
 * @example
 * import { useMidPrice } from 'hyperliquidx';
 * import { effect } from '@preact/signals-core';
 * // Assume eventClient is initialized
 * // const eventClient = ...;
 *
 * const coinConfig = { coin: "ASSET" }; // Replace "ASSET" with the actual coin symbol
 * const { $mid, dispose } = useMidPrice(eventClient, coinConfig);
 *
 * effect(() => {
 * console.log(`Current mid-price for ${coinConfig.coin}:`, $mid.value);
 * });
 *
 * // Later, to unsubscribe:
 * // dispose();
 */
export function useMidPrice(
  eventClient: EventClient<WebSocketTransport>,
  config: { coin: string },
): UseMidPriceReturnValue {
  const $mid = signal<number | undefined>(undefined);
  const unsubscribe = eventClient.allMids((mids) => {
    const maybeMid = mids[config.coin as keyof WsAllMids];
    if (!maybeMid) {
      throw new Error("useMidPrice's configured coin was not found.");
    }
    $mid.value = +maybeMid;
  });

  return { $mid, dispose: () => unsubscribe.then((u) => u.unsubscribe()) };
}
