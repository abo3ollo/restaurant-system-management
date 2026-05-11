/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from "../categories.js";
import type * as context from "../context.js";
import type * as crons from "../crons.js";
import type * as invitations from "../invitations.js";
import type * as lib_subscriptionGuards from "../lib/subscriptionGuards.js";
import type * as lib_subscriptionHelpers from "../lib/subscriptionHelpers.js";
import type * as menuItems from "../menuItems.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as restaurants from "../restaurants.js";
import type * as shifts from "../shifts.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tables from "../tables.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  context: typeof context;
  crons: typeof crons;
  invitations: typeof invitations;
  "lib/subscriptionGuards": typeof lib_subscriptionGuards;
  "lib/subscriptionHelpers": typeof lib_subscriptionHelpers;
  menuItems: typeof menuItems;
  orders: typeof orders;
  payments: typeof payments;
  restaurants: typeof restaurants;
  shifts: typeof shifts;
  subscriptions: typeof subscriptions;
  tables: typeof tables;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
