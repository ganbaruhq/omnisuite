import { Schema } from "effect";

// Schemas for the values a timeline keeps as given (rows, events, options and callbacks): they
// are checked only for their kind, since calendar-core decodes and validates them itself.

/** A Schema that accepts any `T` for which `is` holds, keeping the value as it is. */
export const declared = <T>(is: (u: unknown) => boolean) => Schema.declare((u): u is T => is(u));
export const isArray = (u: unknown) => Array.isArray(u);
export const isObject = (u: unknown) => typeof u === "object" && u !== null;
export const isFunction = (u: unknown) => typeof u === "function";
