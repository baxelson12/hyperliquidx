import type { WalletClient, WebSocketTransport } from "@nktkas/hyperliquid";
import { computed } from "@preact/signals-core";
import type {
  ActionResourceOrderDetails,
  ActionResourceReturnValue,
} from "src/hooks/actions/types";
import { createResource } from "src/utils/resource";
import { round } from "src/utils/round";

/**
 * Provides reactive state for opening a position or adding to an existing one with a market order.
 * This function places a limit order flagged as "FrontendMarket" with reduceOnly set to false,
 * effectively acting as a market order to establish or increase a position.
 * Note: Price is rounded to 1 decimal place, size to 4 decimal places internally.
 *
 * @param walletClient - An initialized Hyperliquid WalletClient instance.
 * @param config - Configuration object containing the order details: `assetId`, `isBuy` (true for long, false for short), `price`, and `size`.
 * @returns An object containing reactive signals (@preact/signals-core):
 * - `$loading`: Signal<boolean> - True if the open order request is in progress.
 * - `$error`: Signal<any> - Holds the error if the request fails, otherwise undefined.
 * - `$data`: Signal<OrderResponseSuccess | undefined> - Holds the successful order placement response, otherwise undefined.
 * @example
 * import { useMarketOpen, type ActionResourceOrderDetails } from 'hyperliquidx';
 *
 * // Assume walletClient is already configured and connected
 * // const walletClient = ...;
 *
 * // Example: Opening a 0.5 long position
 * const openConfig: ActionResourceOrderDetails = {
 * assetId: 13, // Example ID
 * isBuy: true, // True for a long position
 * price: 70000, // A limit price (acts like market due to TIF)
 * size: 0.5     // The amount of the position to open
 * };
 *
 * const { $loading, $error, $data } = useMarketOpen(walletClient, openConfig);
 *
 * effect(() => {
 * if ($loading.value) console.log('Opening position...');
 * if ($data.value) console.log('Position opened successfully:', $data.value);
 * if ($error.value) console.error('Market open failed:', $error.value);
 * });
 */
export function useMarketOpen(
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
            r: false,
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
