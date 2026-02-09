import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';

interface Screen {
    id: number;
    name: string;
    description: string | null;
    refresh_interval: number;
    is_active: boolean;
    widgets_count: number;
    created_at: string;
    updated_at: string;
}

interface ScreensIndexProps extends PageProps {
    screens: Screen[];
}

export default function Index({ auth, screens }: ScreensIndexProps) {
    const handleDelete = (screenId: number) => {
        if (confirm('Are you sure you want to delete this screen?')) {
            router.delete(route('screens.destroy', screenId));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight">
                        Screens
                    </h2>
                    <Button asChild>
                        <Link href={route('screens.create')}>
                            Create Screen
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="Screens" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {screens.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground mb-4">No screens yet. Create your first screen!</p>
                                    <Button asChild>
                                        <Link href={route('screens.create')}>
                                            Create Screen
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {screens.map((screen) => (
                                <Card key={screen.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-xl">{screen.name}</CardTitle>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    screen.is_active
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                            >
                                                {screen.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {screen.description && (
                                            <CardDescription>{screen.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>Refresh: {screen.refresh_interval}s</p>
                                            <p>Widgets: {screen.widgets_count}</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild className="flex-1">
                                            <Link href={route('display.show', screen.id)} target="_blank">
                                                View Display
                                            </Link>
                                        </Button>
                                        <Button size="sm" asChild className="flex-1">
                                            <Link href={route('screens.edit', screen.id)}>
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(screen.id)}
                                        >
                                            Delete
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
