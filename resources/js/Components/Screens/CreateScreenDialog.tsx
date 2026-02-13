import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
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

interface CreateScreenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateScreenDialog({ open, onOpenChange }: CreateScreenDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        refresh_interval: 30,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('screens.store'), {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) reset();
            onOpenChange(isOpen);
        }}>
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle className="font-archia">Create Screen</DialogTitle>
                        <DialogDescription>
                            Create a new display screen with custom configuration.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Screen Name</Label>
                            <Input
                                id="create-name"
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
                            <Label htmlFor="create-description">Description (Optional)</Label>
                            <textarea
                                id="create-description"
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
                            <Label htmlFor="create-refresh">Refresh Interval (seconds)</Label>
                            <Input
                                id="create-refresh"
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
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create Screen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
