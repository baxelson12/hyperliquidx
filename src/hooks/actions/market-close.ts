import type { WalletClient, WebSocketTransport } from "@nktkas/hyperliquid";
import { computed } from "@preact/signals-core";
import type {
  ActionResourceOrderDetails,
  ActionResourceReturnValue,
} from "src/hooks/actions/types";
import { createResource } from "src/utils/resource";
import { round } from "src/utils/round";

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
