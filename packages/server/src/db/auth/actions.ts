"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminAuthClient, createClient } from "../supabase/server";
import { env } from "@itzam/utils/env";
import { createStripeCustomer } from "../billing/actions";
import { z } from "zod";

export async function getUser() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export async function getUserById(id: string) {
  const supabase = await createAdminAuthClient();

  const { data, error } = await supabase.getUserById(id);
  return { data, error };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(formData: FormData, redirectTo?: string) {
  const supabase = await createClient();

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const data = parsed.data;

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, redirectTo: redirectTo ?? "/dashboard/workflows" };
}

export async function signInWithProvider(provider: "google" | "github") {
  const supabase = await createClient();

  const redirectTo =
    env.NEXT_PUBLIC_APP_URL + "/api/auth/callback?next=/dashboard/workflows";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectTo,
    },
  });

  if (error) {
    console.error(error);
    redirect("/error");
  }

  if (data.url) {
    redirect(data.url);
  }
}

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminAuthClient();

  const raw = {
    firstName: formData.get("first-name") as string,
    lastName: formData.get("last-name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    console.error(parsed.error);
    return { success: false, error: parsed.error.message };
  }

  const data = parsed.data;

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  // create stripe customer
  const stripeCustomer = await createStripeCustomer(
    authData?.user?.id ?? "",
    data.firstName + " " + data.lastName,
    data.email
  );

  // update user metadata
  await supabaseAdmin.updateUserById(authData?.user?.id ?? "", {
    user_metadata: {
      name: data.firstName + " " + data.lastName,
      stripeCustomerId: stripeCustomer.id,
    },
  });

  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/onboard" };
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();

  const raw = {
    email: formData.get("email") as string,
  };

  const parsed = forgotPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    console.error(parsed.error);
    return { success: false, error: parsed.error.message };
  }

  const data = parsed.data;

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
  });

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

const updatePasswordSchema = z.object({
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
});

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const raw = {
    password: formData.get("password") as string,
    passwordConfirm: formData.get("password-confirm") as string,
  };

  const parsed = updatePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    console.error(parsed.error);
    return { success: false, error: parsed.error.message };
  } else if (parsed.data.password !== parsed.data.passwordConfirm) {
    return { success: false, error: "Passwords do not match" };
  }

  const data = parsed.data;

  const { error } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markUserAsOnboarded() {
  const supabaseAdmin = await createAdminAuthClient();

  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Unauthorized" };
  }

  const userId = user.data.user.id;

  await supabaseAdmin.updateUserById(userId, {
    user_metadata: { onboarded: true },
  });
}
