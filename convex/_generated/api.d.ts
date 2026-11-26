/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as companies from "../companies.js";
import type * as entries from "../entries.js";
import type * as general_projects from "../general_projects.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_entries from "../lib/entries.js";
import type * as lib_entry_validators from "../lib/entry_validators.js";
import type * as lib_general_projects from "../lib/general_projects.js";
import type * as lib_mobile_auth from "../lib/mobile_auth.js";
import type * as lib_organization from "../lib/organization.js";
import type * as lib_organization_validators from "../lib/organization_validators.js";
import type * as projects from "../projects.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  companies: typeof companies;
  entries: typeof entries;
  general_projects: typeof general_projects;
  health: typeof health;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/entries": typeof lib_entries;
  "lib/entry_validators": typeof lib_entry_validators;
  "lib/general_projects": typeof lib_general_projects;
  "lib/mobile_auth": typeof lib_mobile_auth;
  "lib/organization": typeof lib_organization;
  "lib/organization_validators": typeof lib_organization_validators;
  projects: typeof projects;
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

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authGoogle: import("@convex-dev/auth/components/google/_generated/component.js").ComponentApi<"authGoogle">;
};
