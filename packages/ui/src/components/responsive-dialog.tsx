"use client"

import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adminprop/ui/components/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@adminprop/ui/components/drawer"
import { useIsDesktop } from "@adminprop/ui/hooks/use-media-query"

/**
 * "Mobile = Drawer" (ADMINPROP-UI.md): la misma API que `Dialog`, pero en
 * mobile se muestra como `Drawer` (vaul) y desde `md:` como `Dialog`.
 * Usarlo en vez de `Dialog` para todo lo que el usuario abre desde una pantalla.
 */
const ResponsiveDialogContext = React.createContext(false)

function useDesktop() {
  return React.useContext(ResponsiveDialogContext)
}

function ResponsiveDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  const isDesktop = useIsDesktop()
  const Root = isDesktop ? Dialog : Drawer

  return (
    <ResponsiveDialogContext.Provider value={isDesktop}>
      <Root {...props}>{children}</Root>
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>
) {
  const Trigger = useDesktop() ? DialogTrigger : DrawerTrigger
  return <Trigger {...props} />
}

function ResponsiveDialogClose(
  props: React.ComponentProps<typeof DialogClose>
) {
  const Close = useDesktop() ? DialogClose : DrawerClose
  return <Close {...props} />
}

function ResponsiveDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const Content = useDesktop() ? DialogContent : DrawerContent
  return (
    <Content className={className} {...props}>
      {children}
    </Content>
  )
}

function ResponsiveDialogHeader(props: React.ComponentProps<"div">) {
  const Header = useDesktop() ? DialogHeader : DrawerHeader
  return <Header {...props} />
}

function ResponsiveDialogFooter(props: React.ComponentProps<"div">) {
  const Footer = useDesktop() ? DialogFooter : DrawerFooter
  return <Footer {...props} />
}

function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof DialogTitle>
) {
  const Title = useDesktop() ? DialogTitle : DrawerTitle
  return <Title {...props} />
}

function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>
) {
  const Description = useDesktop() ? DialogDescription : DrawerDescription
  return <Description {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
