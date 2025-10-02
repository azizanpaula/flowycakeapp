export function checkEnvironmentVariables() {
  const requiredEnvVars = {
    clerk: {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    ai: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  };

  const status = {
    clerk: !!(
      requiredEnvVars.clerk.publishableKey && requiredEnvVars.clerk.secretKey
    ),
    supabase: !!(
      requiredEnvVars.supabase.url && requiredEnvVars.supabase.anonKey
    ),
    ai: !!(requiredEnvVars.ai.openai || requiredEnvVars.ai.anthropic),
    allConfigured: false,
  };

  status.allConfigured = status.clerk && status.supabase;

  return status;
}

export function getSetupInstructions() {
  return [
    {
      service: "Clerk",
      description: "Layanan autentikasi untuk manajemen pengguna",
      steps: [
        "Kunjungi https://dashboard.clerk.com/",
        "Buat aplikasi baru",
        "Salin NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY dan CLERK_SECRET_KEY ke .env.local",
      ],
      envVars: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
    },
    {
      service: "Supabase",
      description: "Basis data dan langganan real-time",
      steps: [
        "Kunjungi https://supabase.com/dashboard",
        "Buat proyek baru",
        "Salin NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY ke .env.local",
      ],
      envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    },
    {
      service: "OpenAI",
      description: "Model bahasa AI untuk fitur chat",
      steps: [
        "Kunjungi https://platform.openai.com/",
        "Buat kunci API",
        "Salin OPENAI_API_KEY ke .env.local",
      ],
      envVars: ["OPENAI_API_KEY"],
    },
  ];
}
