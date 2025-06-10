import { createAdminClient } from "./server";

export const getSecret = async (name: string) => {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("get_secret", {
    secret_name: name,
  });

  if (error) {
    console.error(error);
    throw new Error("Error getting secret");
  }

  return data as string;
};

export const createSecret = async (name: string, secret: string) => {
  const supabase = await createAdminClient();
  const { data: secretId, error } = await supabase.rpc("insert_secret", {
    secret_name: name,
    secret_value: secret,
  });

  if (error) {
    console.error(error);
    throw new Error("Error creating secret");
  }

  return secretId as string;
};

export const updateSecret = async (
  secretId: string,
  name: string,
  secret: string
) => {
  const supabase = await createAdminClient();

  const { data: updatedSecretId, error } = await supabase.rpc("update_secret", {
    secret_id: secretId,
    secret_name: name,
    secret_value: secret,
  });

  if (error) {
    console.error(error);
    throw new Error("Error updating secret");
  }

  return updatedSecretId as string;
};

export const deleteSecret = async (name: string) => {
  const supabase = await createAdminClient();
  const { data: deletedSecretId, error } = await supabase.rpc("delete_secret", {
    secret_name: name,
  });

  if (error) {
    console.error(error);
    throw new Error("Error deleting secret");
  }

  return deletedSecretId as string;
};
