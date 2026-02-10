import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';

export default function Create({ auth }: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        refresh_interval: 30,
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('screens.store'));
    };

    return (
        <AppLayout>
            <Head title="Create Screen" />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold leading-tight">
                    Create Screen
                </h2>
                <Button variant="ghost" asChild>
                    <Link href={route('screens.index')}>
                        Back to Screens
                    </Link>
                </Button>
            </div>

            <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Screen Details</CardTitle>
                            <CardDescription>
                                Create a new display screen with custom configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Screen Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <textarea
                                        id="description"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="refresh_interval">Refresh Interval (seconds)</Label>
                                    <Input
                                        id="refresh_interval"
                                        type="number"
                                        min="5"
                                        max="300"
                                        value={data.refresh_interval}
                                        onChange={(e) => setData('refresh_interval', parseInt(e.target.value))}
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        How often the display should refresh (5-300 seconds)
                                    </p>
                                    {errors.refresh_interval && (
                                        <p className="text-sm text-destructive">{errors.refresh_interval}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        Create Screen
                                    </Button>
                                    <Button variant="ghost" asChild>
                                        <Link href={route('screens.index')}>
                                            Cancel
                                        </Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
        </AppLayout>
    );
}
