import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AUTH_STORAGE_KEY = "cakeflow-auth-token";

type SupabaseGlobal = typeof globalThis & {
  supabaseBrowserClient?: SupabaseClient;
};

const withNoStoreFetch = {
  fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
    fetch(url, {
      ...options,
      cache: "no-store",
    }),
};

function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: withNoStoreFetch,
  });
}

export const supabase: SupabaseClient | undefined =
  typeof window === "undefined"
    ? undefined
    : (
        (globalThis as SupabaseGlobal).supabaseBrowserClient ??=
          createBrowserSupabaseClient()
      );

export async function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
