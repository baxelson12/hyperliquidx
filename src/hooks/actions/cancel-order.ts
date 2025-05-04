import type {
  CancelResponseSuccess,
  WalletClient,
  WebSocketTransport,
} from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import type { ActionResourceReturnValue } from "src/hooks/actions/types";
import { createResource } from "src/utils/resource";

export interface UseCancelOrderConfig {
  /** The numeric ID of the asset (e.g., BTC, ETH) */
  assetId: number;
  /** The numeric ID of the order to be cancelled. */
  oid: number;
}

/**
 * Provides reactive state for cancelling a specific order on Hyperliquid.
 * It wraps the `walletClient.cancel` method.
 *
 * @param walletClient - An initialized WalletClient instance with a WebSocketTransport.
 * @param config - Configuration object specifying the asset and order ID to cancel.
 * @returns An object containing reactive signals:
 * - `$loading`: Signal<boolean> - True if the cancel request is in progress.
 * - `$error`: Signal<any> - Holds the error if the request fails, otherwise undefined.
 * - `$data`: Signal<CancelResponseSuccess | undefined> - Holds the successful cancellation response, otherwise undefined.
 * @example
 * import { useCancelOrder, type UseCancelOrderConfig } from 'hyperliquidx';
 *
 * const cancelConfig: UseCancelOrderConfig = { assetId: 13, oid: 987654321 };
 *
 * const { $loading, $error, $data } = useCancelOrder(walletClient, cancelConfig);
 *
 * console.log('Is cancelling:', $loading.value);
 * effect(() => {
 * if ($data.value) {
 * console.log('Order cancelled successfully:', $data.value);
 * }
 * if ($error.value) {
 * console.error('Cancellation failed:', $error.value);
 * }
 * });
 */
export function useCancelOrder(
  walletClient: WalletClient<WebSocketTransport>,
  config: UseCancelOrderConfig,
): Omit<ActionResourceReturnValue, "$data"> & {
  $data: Signal<CancelResponseSuccess | undefined>;
} {
  const resource = createResource(
    () => config,
    async ({ assetId, oid }) =>
      walletClient.cancel({
        cancels: [{ a: assetId, o: oid }],
      }),
  );
  const $loading = computed(() => resource.state.value.loading);
  const $error = computed(() => resource.state.value.error);
  const $data = computed(() => resource.state.value.data);

  return { $loading, $error, $data };
}
