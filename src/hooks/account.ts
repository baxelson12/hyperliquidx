import type {
  AssetPosition,
  EventClient,
  EventOrderUpdatesParameters,
  EventWebData2Parameters,
  Order,
  OrderStatus,
  WsWebData2,
} from "@nktkas/hyperliquid";
import { computed, signal, type Signal } from "@preact/signals-core";

export interface UseWebData2ReturnValue {
  /* Comprehensive user data. */
  $webData2: Signal<WsWebData2 | undefined>;
  /* Unsubscribe from websocket. */
  dispose: () => void;
}

export interface UseOrderUpdatesReturnValue {
  /* Array of order updates which have been created during this subscription. */
  $orderUpdates: Signal<OrderStatus<Order>[]>;
  /* Filtered array of open-only orders */
  $open: Signal<OrderStatus<Order>[]>;
  /* Filtered array of filled-only orders */
  $fills: Signal<OrderStatus<Order>[]>;
  /* Unsubscribe from websocket */
  dispose: () => void;
}

export interface UseAccountBalanceReturnValue {
  /* Currently withdrawable amount (balance) */
  $balance: Signal<number | undefined>;
}

export interface UseAccountPositionsReturnValue {
  /* Currently open positions */
  $positions: Signal<AssetPosition[]>;
}

export function useWebData2(
  eventClient: EventClient,
  config: EventWebData2Parameters,
): UseWebData2ReturnValue {
  const $webData2 = signal<WsWebData2 | undefined>(undefined);
  const unsubscribe = eventClient.webData2(
    config,
    (data) => ($webData2.value = { ...data }),
  );

  return {
    $webData2,
    dispose: () => unsubscribe.then((u) => u.unsubscribe()),
  };
}

export function useOrderUpdates(
  eventClient: EventClient,
  config: EventOrderUpdatesParameters,
): UseOrderUpdatesReturnValue {
  const $orderUpdates = signal<OrderStatus<Order>[]>([]);
  const unsubscribe = eventClient.orderUpdates(
    config,
    (orders) => ($orderUpdates.value = [...orders]),
  );
  return {
    $orderUpdates,
    $open: computed(() =>
      $orderUpdates.value.filter((v) => v.status === "open"),
    ),
    $fills: computed(() =>
      $orderUpdates.value.filter((v) => v.status === "filled"),
    ),
    dispose: () => unsubscribe.then((u) => u.unsubscribe()),
  };
}

export function useAccountBalance({
  $webData2,
}: UseWebData2ReturnValue): UseAccountBalanceReturnValue {
  return {
    $balance: computed(() =>
      $webData2.value
        ? +$webData2.value.clearinghouseState.withdrawable
        : undefined,
    ),
  };
}

export function useAccountPositions({
  $webData2,
}: UseWebData2ReturnValue): UseAccountPositionsReturnValue {
  return {
    $positions: computed(() =>
      $webData2.value ? $webData2.value.clearinghouseState.assetPositions : [],
    ),
  };
}
