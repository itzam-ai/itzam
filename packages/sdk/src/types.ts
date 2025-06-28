import {
  asConst,
  type FromSchema,
  type JSONSchema as LibJsonSchema,
} from "json-schema-to-ts";
import type { Narrow } from "json-schema-to-ts/lib/types/type-utils";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4/core";

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};
export type ZodV4Schema = z4.$ZodObject;

export type ZodSchema = z3.ZodTypeAny | z4.$ZodObject;
export type JsonSchema = LibJsonSchema;

export type JsonOrZodSchema = JsonSchema | ZodSchema;

export type InferFromZodV4Schema<T extends z4.$ZodObject> = z4.infer<T>;
export type InferFromZodV3Schema<T extends z3.ZodTypeAny> = z3.infer<T>;

asConst;
export type InferFromJsonSchema<T extends JsonSchema> = FromSchema<Narrow<T>>;

export type InferReturnFromSchema<T extends JsonOrZodSchema> =
  T extends z4.$ZodObject
    ? InferFromZodV4Schema<T>
    : T extends z3.ZodTypeAny
      ? InferFromZodV3Schema<T>
      : T extends JsonSchema
        ? InferFromJsonSchema<T>
        : never;
