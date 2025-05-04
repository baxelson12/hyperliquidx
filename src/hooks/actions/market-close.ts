import type { WalletClient, WebSocketTransport } from "@nktkas/hyperliquid";
import { computed } from "@preact/signals-core";
import type {
  ActionResourceOrderDetails,
  ActionResourceReturnValue,
} from "src/hooks/actions/types";
import { createResource } from "src/utils/resource";
import { round } from "src/utils/round";

/**
 * Provides reactive state for closing a position with a market order.
 * This function places a reduce-only limit order flagged as "FrontendMarket",
 * effectively acting as a market order to close the specified size of a position.
 * Note: The order direction (`isBuy`) should be the opposite of the position you intend to close.
 *
 * @param walletClient - An initialized WalletClient instance with a WebSocketTransport.
 * @param config - Configuration object containing the order details. Requires `assetId`, `isBuy`, `price`, and `size`.
 * @returns An object containing reactive signals:
 * - `$loading`: Signal<boolean> - True if the close order request is in progress.
 * - `$error`: Signal<any> - Holds the error if the request fails, otherwise undefined.
 * - `$data`: Signal<OrderResponseSuccess | undefined> - Holds the successful order placement response, otherwise undefined.
 * @example
 * import { useMarketClose, type ActionResourceOrderDetails } from 'hyperliquidx';
 *
 * // Example: Closing a 0.1 ETH short position (requires a BUY order)
 * const closeConfig: ActionResourceOrderDetails = {
 * assetId: 4, // Example ID
 * isBuy: true, // Must be true to close a short position
 * price: 3000, // A limit price (acts like market due to TIF)
 * size: 0.1    // The amount of the position to close
 * };
 *
 * const { $loading, $error, $data } = useMarketClose(walletClient, closeConfig);
 *
 * // Example of accessing the reactive state
 * effect(() => {
 * if ($loading.value) console.log('Closing position...');
 * if ($data.value) console.log('Position closed successfully:', $data.value);
 * if ($error.value) console.error('Market close failed:', $error.value);
 * });
 */
export function useMarketClose(
  walletClient: WalletClient<WebSocketTransport>,
  config: ActionResourceOrderDetails,
): ActionResourceReturnValue {
  const resource = createResource(
    () => config,
    async ({ assetId, isBuy, price, size }) =>
      await walletClient.order({
        orders: [
          {
            a: assetId,
            b: isBuy,
            p: round(price, 1).toString(),
            s: round(size, 4).toString(),
            r: true,
            t: { limit: { tif: "FrontendMarket" } },
          },
        ],
        grouping: "na",
      }),
  );
  const $loading = computed(() => resource.state.value.loading);
  const $error = computed(() => resource.state.value.error);
  const $data = computed(() => resource.state.value.data);

  return { $loading, $error, $data };
}
