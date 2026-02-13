import { MoreHorizontal, Pencil, ExternalLink, Trash2, Plus, Monitor } from 'lucide-react';
import { router } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuAction,
} from '@/Components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import type { SharedScreen } from '@/types';

interface NavScreensProps {
    screens: SharedScreen[];
    activeScreenId: number | null;
    onCreateClick: () => void;
    onEditClick: (screen: SharedScreen) => void;
}

export function NavScreens({ screens, activeScreenId, onCreateClick, onEditClick }: NavScreensProps) {
    const handleScreenClick = (screenId: number) => {
        router.visit(`/screens?active=${screenId}`, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (screenId: number) => {
        if (confirm('Are you sure you want to delete this screen?')) {
            router.delete(route('screens.destroy', screenId));
        }
    };

    return (
        <SidebarGroup>
            <div className="flex items-center justify-between px-1 py-2 pb-4">
                <span className="font-archia text-md font-semibold tracking-tight text-sidebar-foreground">
                    Screens
                </span>
                <button
                    onClick={onCreateClick}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    title="New screen"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            <SidebarMenu>
                {screens.map((screen) => (
                    <SidebarMenuItem key={screen.id}>
                        <SidebarMenuButton
                            isActive={screen.id === activeScreenId}
                            onClick={() => handleScreenClick(screen.id)}
                            tooltip={screen.name}
                        >
                            <Monitor className="h-4 w-4" />
                            <span>{screen.name}</span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction>
                                    <MoreHorizontal className="h-4 w-4" />
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start">
                                <DropdownMenuItem onClick={() => onEditClick(screen)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={route('display.show', screen.id)} target="_blank">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Display
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(screen.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                ))}
                {screens.length === 0 && (
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={onCreateClick} className="text-muted-foreground">
                            <Plus className="h-4 w-4" />
                            <span>Add your first screen</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
