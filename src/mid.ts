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
