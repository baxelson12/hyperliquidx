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

/**
 * Defines the return object structure for the `useWebData2` hook.
 * Provides reactive access to the comprehensive user state websocket stream and a way to unsubscribe.
 */
export interface UseWebData2ReturnValue {
  /* Comprehensive user data. */
  $webData2: Signal<WsWebData2 | undefined>;
  /* Unsubscribe from websocket. */
  dispose: () => void;
}

/**
 * Defines the return object structure for the `useOrderUpdates` hook.
 * Provides reactive signals for order updates and a way to unsubscribe.
 */
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

/**
 * Defines the return object structure for the `useAccountBalance` hook.
 * Provides a reactive signal for the user's withdrawable balance.
 */
export interface UseAccountBalanceReturnValue {
  /* Currently withdrawable amount (balance) */
  $balance: Signal<number | undefined>;
}

/**
 * Defines the return object structure for the `useAccountPositions` hook.
 * Provides a reactive signal for the user's open positions.
 */
export interface UseAccountPositionsReturnValue {
  /* Currently open positions */
  $positions: Signal<AssetPosition[]>;
}

/**
 * Subscribes to the comprehensive `webData2` websocket stream for a user via the EventClient.
 * Provides the full user account state reactively. Remember to call `dispose` when finished.
 *
 * @param eventClient - An initialized Hyperliquid EventClient instance.
 * @param config - Configuration for the subscription, typically `{ user: string }` specifying the target user address.
 * @returns A `UseWebData2ReturnValue` object containing the `$webData2` signal and the `dispose` function.
 * @example
 * import { useWebData2, type EventWebData2Parameters } from 'hyperliquidx';
 * import { effect } from '@preact/signals-core';
 * // Assume eventClient is initialized and userAddress is defined
 * // const eventClient = ...;
 * // const userAddress = '0x...';
 *
 * const webDataConfig: EventWebData2Parameters = { user: userAddress };
 * const { $webData2, dispose } = useWebData2(eventClient, webDataConfig);
 *
 * effect(() => {
 * if ($webData2.value) {
 * console.log('Latest web data:', $webData2.value.clearinghouseState.marginSummary.accountValue);
 * }
 * });
 *
 * // Later, to unsubscribe:
 * // dispose();
 */
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

/**
 * Subscribes to the user's order updates websocket stream via the EventClient.
 * Provides reactive signals for all order updates, open orders, and fills. Remember to call `dispose`.
 *
 * @param eventClient - An initialized Hyperliquid EventClient instance.
 * @param config - Configuration for the subscription, typically `{ user: string }` specifying the target user address.
 * @returns A `UseOrderUpdatesReturnValue` object with signals for orders (`$orderUpdates`, `$open`, `$fills`) and a `dispose` function.
 * @example
 * import { useOrderUpdates, type EventOrderUpdatesParameters } from 'hyperliquidx';
 * import { effect } from '@preact/signals-core';
 * // Assume eventClient is initialized and userAddress is defined
 * // const eventClient = ...;
 * // const userAddress = '0x...';
 *
 * const orderUpdatesConfig: EventOrderUpdatesParameters = { user: userAddress };
 * const { $orderUpdates, $open, $fills, dispose } = useOrderUpdates(eventClient, orderUpdatesConfig);
 *
 * effect(() => {
 * console.log('Current open orders:', $open.value.length);
 * console.log('Latest filled orders:', $fills.value);
 * });
 *
 * // Later, to unsubscribe:
 * // dispose();
 */
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

/**
 * A selector hook that derives the user's withdrawable balance reactively
 * from the `$webData2` signal provided by `useWebData2`.
 *
 * @param useWebData2ReturnValue - The object returned by a call to `useWebData2`.
 * @returns A `UseAccountBalanceReturnValue` object containing the reactive `$balance` signal.
 * @example
 * import { useWebData2, useAccountBalance, type EventWebData2Parameters } from 'hyperliquidx';
 * import { effect } from '@preact/signals-core';
 * // Assume eventClient and userAddress are defined
 * // const eventClient = ...;
 * // const userAddress = '0x...';
 *
 * const webDataConfig: EventWebData2Parameters = { user: userAddress };
 * const webDataState = useWebData2(eventClient, webDataConfig); // Call the main hook first
 * const { $balance } = useAccountBalance(webDataState);        // Pass the state to the selector hook
 *
 * effect(() => {
 * console.log('Current withdrawable balance:', $balance.value);
 * });
 *
 * // Remember to call webDataState.dispose() when done.
 */
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

/**
 * A selector hook that extracts the user's current open positions reactively
 * from the `$webData2` signal provided by `useWebData2`.
 *
 * @param useWebData2ReturnValue - The object returned by a call to `useWebData2`.
 * @returns A `UseAccountPositionsReturnValue` object containing the reactive `$positions` signal.
 * @example
 * import { useWebData2, useAccountPositions, type EventWebData2Parameters } from 'hyperliquidx';
 * import { effect } from '@preact/signals-core';
 * // Assume eventClient and userAddress are defined
 * // const eventClient = ...;
 * // const userAddress = '0x...';
 *
 * const webDataConfig: EventWebData2Parameters = { user: userAddress };
 * const webDataState = useWebData2(eventClient, webDataConfig);        // Call the main hook first
 * const { $positions } = useAccountPositions(webDataState);           // Pass the state to the selector hook
 *
 * effect(() => {
 * console.log('Current positions:', $positions.value);
 * });
 *
 * // Remember to call webDataState.dispose() when done.
 */
export function useAccountPositions({
  $webData2,
}: UseWebData2ReturnValue): UseAccountPositionsReturnValue {
  return {
    $positions: computed(() =>
      $webData2.value ? $webData2.value.clearinghouseState.assetPositions : [],
    ),
  };
}
