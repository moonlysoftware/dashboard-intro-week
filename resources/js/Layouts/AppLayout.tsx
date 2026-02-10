import { AppSidebar } from "@/Components/app-sidebar"
import { SiteHeader } from "@/Components/site-header"
import { SidebarInset, SidebarProvider } from "@/Components/ui/sidebar"
import { PropsWithChildren } from "react"

export default function AppLayout({ children }: PropsWithChildren) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                            {children}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
