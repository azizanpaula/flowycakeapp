"use client";

import { Button } from "@/components/ui/button";
import { checkEnvironmentVariables } from "@/lib/env-check";
import {
  CheckCircle,
  Zap,
  Database,
  Shield,
  ExternalLink,
  Cake,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [envStatus, setEnvStatus] = useState({
    clerk: false,
    supabase: false,
    ai: false,
    allConfigured: false,
  });

  useEffect(() => {
    setEnvStatus(checkEnvironmentVariables());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="text-center py-12 sm:py-16 relative px-4">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <SignedIn>
              <Link href="/dashboard/cakeflow">
                <Button size="sm" className="text-xs sm:text-sm">
                  <Cake className="w-4 h-4 mr-1" />
                  Dasbor
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                  Masuk
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Cake className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-500 to-blue-400 bg-clip-text text-transparent">
            CakeFlow
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          Aplikasi Manajemen Usaha Kue Modern
        </p>
      </div>

      <main className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-8 max-w-5xl">
        {envStatus.allConfigured ? (
          <div className="text-center mb-8">
            <div className="text-4xl sm:text-5xl mb-2">🎉</div>
            <div className="font-bold text-lg sm:text-xl mb-1">Semua Siap!</div>
            <div className="text-sm sm:text-base text-muted-foreground mb-6">
              Aplikasi siap digunakan
            </div>
            <SignedIn>
              <Link href="/dashboard/cakeflow">
                <Button size="lg" className="text-base">
                  <Cake className="w-5 h-5 mr-2" />
                  Buka Dasbor CakeFlow
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="text-base">
                  Masuk untuk Mulai
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl sm:text-5xl mb-2">⚠️</div>
              <div className="font-semibold text-lg sm:text-xl mb-1">
                Setup Diperlukan
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">
                Ambil key untuk variabel lingkungan
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {/* Clerk */}
              <div className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                <div className="flex justify-center mb-3">
                  {envStatus.clerk ? (
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  ) : (
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                  )}
                </div>
                <div className="font-semibold mb-2 text-sm sm:text-base">
                  Autentikasi Clerk
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {envStatus.clerk ? "✓ Siap" : "Perlu pengaturan"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open("https://dashboard.clerk.com", "_blank")
                  }
                  className="w-full text-xs sm:text-sm"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Dasbor
                </Button>
              </div>

              {/* Supabase */}
              <div className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                <div className="flex justify-center mb-3">
                  {envStatus.supabase ? (
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  ) : (
                    <Database className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  )}
                </div>
                <div className="font-semibold mb-2 text-sm sm:text-base">
                  Basis Data Supabase
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {envStatus.supabase ? "✓ Siap" : "Perlu pengaturan"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open("https://supabase.com/dashboard", "_blank")
                  }
                  className="w-full text-xs sm:text-sm"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Dasbor
                </Button>
              </div>

              {/* AI */}
              <div className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 sm:col-span-2 md:col-span-1">
                <div className="flex justify-center mb-3">
                  {envStatus.ai ? (
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  ) : (
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                  )}
                </div>
                <div className="font-semibold mb-2 text-sm sm:text-base">
                  SDK AI
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {envStatus.ai ? "✓ Siap" : "Opsional"}
                </div>
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open("https://platform.openai.com", "_blank")
                    }
                    className="text-xs px-1 sm:px-2"
                  >
                    OpenAI
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open("https://console.anthropic.com", "_blank")
                    }
                    className="text-xs px-1 sm:px-2"
                  >
                    Anthropic
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
