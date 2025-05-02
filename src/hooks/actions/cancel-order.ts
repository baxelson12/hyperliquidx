import type {
  CancelResponseSuccess,
  WalletClient,
  WebSocketTransport,
} from "@nktkas/hyperliquid";
import { computed, type Signal } from "@preact/signals-core";
import type { ActionResourceReturnValue } from "src/hooks/actions/types";
import { createResource } from "src/utils/resource";

export interface UseCancelOrderConfig {
  assetId: number;
  oid: number;
}

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
