"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MoreHorizontal } from "lucide-react"

import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@adminprop/ui/components/bottom-sheet"
import { cn } from "@adminprop/ui/lib/utils"

import { isActivePath, navItems, type NavItem } from "@/lib/navigation"

/** Slot de marca: se reemplaza por el logo del tenant cuando exista. */
function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "font-serif text-xl font-semibold tracking-tight",
        className
      )}
    >
      Adminprop
    </Link>
  )
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-nav-muted transition-colors hover:bg-white/5 hover:text-nav-foreground",
        active && "bg-white/10 text-nav-foreground"
      )}
    >
      <Icon className={cn("size-4", active && "text-nav-active")} />
      {item.label}
    </Link>
  )
}

function BottomNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-nav-muted",
        active && "text-nav-foreground"
      )}
    >
      <Icon className={cn("size-5", active && "text-nav-active")} />
      {item.label}
    </Link>
  )
}

function MoreSheet({ pathname }: { pathname: string }) {
  const [open, setOpen] = React.useState(false)
  const secondary = navItems.filter((item) => !item.primaryOnMobile)
  const active = secondary.some((item) => isActivePath(pathname, item.href))

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger
        className={cn(
          "flex flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-nav-muted",
          active && "text-nav-foreground"
        )}
      >
        <MoreHorizontal className={cn("size-5", active && "text-nav-active")} />
        Más
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Más secciones</BottomSheetTitle>
        </BottomSheetHeader>
        <nav className="grid gap-1">
          {secondary.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium hover:bg-muted",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
              >
                <Icon className="size-5 text-accent" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </BottomSheetContent>
    </BottomSheet>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-svh md:grid md:grid-cols-[15rem_1fr]">
      {/* Desktop: sidebar */}
      <aside className="sticky top-0 hidden h-svh flex-col gap-8 bg-nav px-4 py-6 text-nav-foreground md:flex">
        <BrandMark className="px-3" />
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col">
        {/* Mobile: barra superior */}
        <header className="sticky top-0 z-30 flex h-14 items-center bg-nav px-4 pt-[env(safe-area-inset-top)] text-nav-foreground md:hidden">
          <BrandMark />
        </header>

        <main className="flex-1 px-4 pt-6 pb-28 md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile: navegación inferior */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 bg-nav pb-[env(safe-area-inset-bottom)] text-nav-foreground md:hidden"
      >
        {navItems
          .filter((item) => item.primaryOnMobile)
          .map((item) => (
            <BottomNavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
            />
          ))}
        <MoreSheet pathname={pathname} />
      </nav>
    </div>
  )
}
