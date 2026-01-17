/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as admin from "../admin.js";
import type * as allowedEmails from "../allowedEmails.js";
import type * as auth from "../auth.js";
import type * as companies from "../companies.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_requireAdmin from "../lib/requireAdmin.js";
import type * as mutations from "../mutations.js";
import type * as residencies from "../residencies.js";
import type * as sync from "../sync.js";
import type * as testimonials from "../testimonials.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  admin: typeof admin;
  allowedEmails: typeof allowedEmails;
  auth: typeof auth;
  companies: typeof companies;
  crons: typeof crons;
  http: typeof http;
  "lib/requireAdmin": typeof lib_requireAdmin;
  mutations: typeof mutations;
  residencies: typeof residencies;
  sync: typeof sync;
  testimonials: typeof testimonials;
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
