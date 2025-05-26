"use client";

import { createClient } from "@itzam/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function useCurrentUser() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setError(error);
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  return { user, loading, isSignedIn: user !== null && !error, error };
}
