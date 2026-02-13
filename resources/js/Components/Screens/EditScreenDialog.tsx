import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import type { SharedScreen } from '@/types';

interface EditScreenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    screen: SharedScreen | null;
}

export function EditScreenDialog({ open, onOpenChange, screen }: EditScreenDialogProps) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        name: '',
        description: '',
        refresh_interval: 30,
    });

    useEffect(() => {
        if (screen) {
            setData({
                name: screen.name,
                description: screen.description || '',
                refresh_interval: screen.refresh_interval,
            });
        }
    }, [screen]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!screen) return;
        patch(route('screens.update', screen.id), {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle className="font-archia">Edit Screen</DialogTitle>
                        <DialogDescription>
                            Update the screen settings.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Screen Name</Label>
                            <Input
                                id="edit-name"
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
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <textarea
                                id="edit-description"
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
                            <Label htmlFor="edit-refresh">Refresh Interval (seconds)</Label>
                            <Input
                                id="edit-refresh"
                                type="number"
                                min="5"
                                max="300"
                                value={data.refresh_interval}
                                onChange={(e) => setData('refresh_interval', parseInt(e.target.value))}
                                required
                            />
                            {errors.refresh_interval && (
                                <p className="text-sm text-destructive">{errors.refresh_interval}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Update Screen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
