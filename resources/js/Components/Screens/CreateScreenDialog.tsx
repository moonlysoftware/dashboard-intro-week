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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';

interface CreateScreenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateScreenDialog({ open, onOpenChange }: CreateScreenDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        refresh_interval: 30,
        screen_type: 'slideshow' as 'slideshow' | 'general' | 'technical',
        screen_config: { cycleSeconds: 60 },
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
                            <Label>Screen Type</Label>
                            <Select value={data.screen_type} onValueChange={(v) => setData('screen_type', v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slideshow">Slideshow — cycling carousel (coffee corner)</SelectItem>
                                    <SelectItem value="general">General — static bento (common area)</SelectItem>
                                    <SelectItem value="technical">Technical — status & sport (tech room)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.screen_type && (
                                <p className="text-sm text-destructive">{errors.screen_type}</p>
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
