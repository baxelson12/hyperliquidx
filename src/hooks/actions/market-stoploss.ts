import type { WalletClient, WebSocketTransport } from "@nktkas/hyperliquid";
import { computed } from "@preact/signals-core";
import type {
  ActionResourceOrderDetails,
  ActionResourceReturnValue,
} from "src/hooks/actions/types";
import { createResource } from "src/utils/resource";
import { round } from "src/utils/round";

/**
 * Provides reactive state for placing a market stop-loss order.
 * This function places a reduce-only trigger order that executes as a market order
 * if the market price crosses the specified trigger price (`config.price`).
 * It uses the `tpsl: "sl"` and `isMarket: true` flags internally.
 * Note: The order direction (`isBuy`) should be the opposite of the position you are protecting.
 * Price and trigger price are rounded to 1 decimal place, size to 4 decimal places internally.
 *
 * @param walletClient - An initialized Hyperliquid WalletClient instance.
 * @param config - Configuration object for the stop-loss order:
 * - `assetId`: The numeric ID of the asset.
 * - `isBuy`: The direction of the stop order (true for buy stop to cover short, false for sell stop to protect long).
 * - `price`: The trigger price at which the market stop-loss order activates.
 * - `size`: The amount of the position to close when the stop is triggered.
 * @returns An object containing reactive signals (@preact/signals-core):
 * - `$loading`: Signal<boolean> - True if the stop-loss order request is in progress.
 * - `$error`: Signal<any> - Holds the error if the request fails, otherwise undefined.
 * - `$data`: Signal<OrderResponseSuccess | undefined> - Holds the successful order placement response, otherwise undefined.
 * @example
 * import { useMarketStoploss, type ActionResourceOrderDetails } from 'hyperliquidx';
 * import { effect } from '@preact/signals-core';
 *
 * // Assume walletClient is already configured and connected
 * // const walletClient = ...;
 *
 * // Example: Placing a sell stop-loss for a 10 unit long position on some asset, triggering at 50.0
 * const slConfig: ActionResourceOrderDetails = {
 * assetId: 42, // ID for the asset
 * isBuy: false, // False for a sell stop-loss (protects a long position)
 * price: 50.0,  // Trigger price for the stop-loss
 * size: 10      // The amount of the position to close
 * };
 *
 * const { $loading, $error, $data } = useMarketStoploss(walletClient, slConfig);
 *
 * // Example of accessing the reactive state using @preact/signals-core
 * effect(() => {
 * if ($loading.value) console.log('Placing stop-loss order...');
 * if ($data.value) console.log('Stop-loss placed successfully:', $data.value);
 * if ($error.value) console.error('Stop-loss placement failed:', $error.value);
 * });
 */
export function useMarketStoploss(
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
            t: {
              trigger: {
                isMarket: true,
                triggerPx: round(price, 1).toString(),
                tpsl: "sl",
              },
            },
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
