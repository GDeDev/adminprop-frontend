"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"

import { SessionProvider } from "@adminprop/session/client"
import { Toaster } from "@adminprop/ui/components/sonner"
import { TooltipProvider } from "@adminprop/ui/components/tooltip"

import { apiClient } from "@/lib/api-client"
import { LOGIN_PATH } from "@/lib/session"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Un QueryClient por sesión de navegador (no compartido entre requests).
  const [queryClient] = React.useState(makeQueryClient)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          apiClient={apiClient}
          loginPath={LOGIN_PATH}
          // Que el próximo usuario en esta pestaña no vea datos cacheados del anterior.
          onSignOut={() => queryClient.clear()}
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
