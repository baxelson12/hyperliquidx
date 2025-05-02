import type { OrderResponseSuccess } from "@nktkas/hyperliquid";
import type { Signal } from "@preact/signals-core";

export interface ActionResourceReturnValue {
  $loading: Signal<boolean>;
  $error: Signal<Error | undefined>;
  $data: Signal<OrderResponseSuccess | undefined>;
}

export interface ActionResourceOrderDetails {
  assetId: number;
  isBuy: boolean;
  size: number;
  price: number;
}
