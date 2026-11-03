import { getTenantBranding } from "@/lib/tenant-branding"

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const branding = await getTenantBranding()

  return (
    <div className="flex min-h-svh flex-col bg-sidebar px-4 py-10 text-sidebar-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
        <div className="flex flex-col items-center gap-3">
          {branding?.logoUrl && (
            // Logo del tenant (cookie de marca): host variable, sin next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt=""
              className="max-h-16 w-auto max-w-48 object-contain"
            />
          )}
          <p className="text-center font-display text-3xl font-semibold tracking-tight">
            {branding?.name ?? "Adminprop"}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
