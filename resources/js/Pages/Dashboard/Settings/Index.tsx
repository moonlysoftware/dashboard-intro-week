import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Settings
                </h2>
            }
        >
            <Head title="Settings" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                            <p className="text-gray-600">
                                Settings configuratie komt hier. Hier kun je algemene instellingen voor het dashboard configureren.
                            </p>

                            {/* Placeholder voor toekomstige settings */}
                            <div className="mt-6 space-y-4">
                                <div className="border-b pb-4">
                                    <h4 className="font-medium text-gray-900">Display Settings</h4>
                                    <p className="text-sm text-gray-600">Configure default display settings for all screens</p>
                                </div>
                                <div className="border-b pb-4">
                                    <h4 className="font-medium text-gray-900">Widget Defaults</h4>
                                    <p className="text-sm text-gray-600">Set default configurations for widgets</p>
                                </div>
                                <div className="border-b pb-4">
                                    <h4 className="font-medium text-gray-900">Notifications</h4>
                                    <p className="text-sm text-gray-600">Configure notification settings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
