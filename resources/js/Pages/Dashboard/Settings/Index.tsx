import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';

interface Setting {
    id: number;
    key: string;
    value: string | null;
    type: string;
}

interface SettingsIndexProps extends PageProps {
    settings: Record<string, Setting>;
}

export default function Index({ auth, settings }: SettingsIndexProps) {
    return (
        <AppLayout>
            <Head title="Settings" />

            <h2 className="text-xl font-semibold leading-tight mb-6">
                Settings
            </h2>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <p className="text-muted-foreground">
                    Settings configuratie komt hier. Hier kun je algemene instellingen voor het dashboard configureren.
                </p>

                <div className="mt-6 space-y-4">
                    <div className="border-b pb-4">
                        <h4 className="font-medium">Display Settings</h4>
                        <p className="text-sm text-muted-foreground">Configure default display settings for all screens</p>
                    </div>
                    <div className="border-b pb-4">
                        <h4 className="font-medium">Widget Defaults</h4>
                        <p className="text-sm text-muted-foreground">Set default configurations for widgets</p>
                    </div>
                    <div className="border-b pb-4">
                        <h4 className="font-medium">Notifications</h4>
                        <p className="text-sm text-muted-foreground">Configure notification settings</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
