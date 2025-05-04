import type { OrderResponseSuccess } from "@nktkas/hyperliquid";
import type { Signal } from "@preact/signals-core";

/**
 * Defines the standard return object structure for reactive action hooks.
 * It provides signals representing the state of an asynchronous operation (e.g., placing an order).
 */
export interface ActionResourceReturnValue {
  /** Signal<boolean>: True if the action (e.g., API request) is currently executing. */
  $loading: Signal<boolean>;
  /** Signal<Error | undefined>: Holds the error object if the action failed, otherwise undefined. */
  $error: Signal<Error | undefined>;
  /** Signal<OrderResponseSuccess | undefined>: Holds the success response data from the action, otherwise undefined. Type may vary for non-order actions. */
  $data: Signal<OrderResponseSuccess | undefined>;
}

/**
 * Defines the input parameters required for placing most order types
 * via the reactive action hooks (e.g., useMarketOpen, useMarketStoploss).
 * @example
 * const orderDetails: ActionResourceOrderDetails = {
 * assetId: 42, // ID for the desired asset
 * isBuy: true, // Placing a buy order
 * size: 1.5,   // Order quantity
 * price: 55000 // Price (meaning depends on order type: limit price, trigger price, etc.)
 * };
 */
export interface ActionResourceOrderDetails {
  /** The numeric identifier for the asset (e.g., coin) to trade. */
  assetId: number;
  /** Boolean indicating the order direction: true for buy/long, false for sell/short. */
  isBuy: boolean;
  /** The quantity/amount of the asset for the order. */
  size: number;
  /** The price associated with the order. Its exact meaning depends on the action hook used:
   * - For limit orders: the limit price.
   * - For market opens/closes: typically used internally for order processing (e.g., FrontendMarket TIF).
   * - For stop-loss/take-profit: the trigger price.
   */
  price: number;
}
