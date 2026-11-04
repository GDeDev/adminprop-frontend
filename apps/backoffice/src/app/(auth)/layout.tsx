export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col bg-sidebar chrome-glow px-4 py-10 text-sidebar-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
        {/* Slot de marca: logo del tenant cuando exista */}
        <p className="text-center font-display text-display-md font-semibold">
          Adminprop
        </p>
        {children}
      </div>
    </div>
  )
}
