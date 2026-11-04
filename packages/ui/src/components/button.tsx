import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 pressable items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary-gradient text-primary-foreground shadow-primary-edge hover:glow-primary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-primary-edge hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-card shadow-edge hover:bg-muted hover:text-foreground dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Lo asistido por IA (sugerir precio, redactar). Sólido para el contraste.
        ai: "bg-ai text-ai-foreground shadow-primary-edge hover:glow-ai",
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3 md:h-9",
        xs: "h-11 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 md:h-6 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-11 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 md:h-8",
        lg: "h-11 rounded-md px-6 has-[>svg]:px-4 md:h-10",
        icon: "size-11 md:size-9",
        "icon-xs":
          "size-11 rounded-md md:size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-11 md:size-8",
        "icon-lg": "size-11 md:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
