"use client"

import * as React from "react"
import {
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react"

import { useTheme } from "@/Components/theme-provider"
import { NavScreens } from "@/Components/nav-screens"
import { NavUser } from "@/Components/nav-user"
import { CreateScreenDialog } from "@/Components/Screens/CreateScreenDialog"
import { EditScreenDialog } from "@/Components/Screens/EditScreenDialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/Components/ui/sidebar"
import { usePage } from "@inertiajs/react"
import { PageProps, SharedScreen } from "@/types"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { theme, setTheme } = useTheme()
  const { auth, screens } = usePage<PageProps>().props

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingScreen, setEditingScreen] = React.useState<SharedScreen | null>(null)

  // Parse active screen ID from URL
  const activeScreenId = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('active')
    return id ? parseInt(id, 10) : null
  }, [window.location.search])

  const handleEditClick = (screen: SharedScreen) => {
    setEditingScreen(screen)
    setEditDialogOpen(true)
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const user = {
    name: auth.user.name,
    email: auth.user.email,
    avatar: "",
  }

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href={route('screens.index')}>
                  <img src={isDark ? "/storage/moonly-logo-white.svg" : "/storage/moonly-logo-black.svg"} alt="Logo Moonly" className="h-6 w-auto" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavScreens
            screens={screens}
            activeScreenId={activeScreenId}
            onCreateClick={() => setCreateDialogOpen(true)}
            onEditClick={handleEditClick}
          />
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/settings">
                      <SettingsIcon />
                      <span>Settings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  >
                    {isDark ? <SunIcon /> : <MoonIcon />}
                    <span>{isDark ? "Light mode" : "Dark mode"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>

      <CreateScreenDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EditScreenDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        screen={editingScreen}
      />
    </>
  )
}
