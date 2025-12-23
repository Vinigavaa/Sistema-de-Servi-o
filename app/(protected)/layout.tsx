import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
  import { AppSidebar } from "@/components/ui/app-sidebar"

  export default function ProtectedLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 p-4">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }