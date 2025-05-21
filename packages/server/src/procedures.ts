import { tryCatch } from "@itzam/utils";
import { User } from "@supabase/supabase-js";
import { cache } from "react";
import { getUser } from "./db/auth/actions";

export const protectedProcedure = cache(
  <TArgs extends unknown[], TReturn>(
    fn: (
      {
        user,
      }: {
        user: User;
      },
      ...args: TArgs
    ) => TReturn
  ) => {
    return async (...args: TArgs) => {
      const { data: user, error } = await tryCatch(getUser());

      if (error) {
        return {
          error: {
            type: "UNAUTHORIZED",
            error: error,
          },
          data: null,
        };
      }

      if (!user || !user.data || !user.data.user) {
        return {
          error: {
            type: "UNAUTHORIZED",
            error: "User not found",
          },
          data: null,
        };
      }

      return fn({ user: user.data.user }, ...args);
    };
  }
);

export const adminProcedure = cache(
  <TArgs extends unknown[], TReturn>(
    fn: (
      {
        user,
      }: {
        user: User;
      },
      ...args: TArgs
    ) => TReturn
  ) => {
    return protectedProcedure(async (ctx, ...args: TArgs) => {
      if (ctx.user.role !== "ADMIN") {
        return {
          error: {
            type: "UNAUTHORIZED",
            error: "User is not an admin",
          },
          data: null,
        };
      }

      return fn(ctx, ...args);
    });
  }
);
