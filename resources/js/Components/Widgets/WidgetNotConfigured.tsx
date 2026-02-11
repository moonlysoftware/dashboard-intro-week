interface WidgetNotConfiguredProps {
    message?: string;
}

export default function WidgetNotConfigured({ message }: WidgetNotConfiguredProps) {
    return (
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                ⚙️
            </div>
            <div>
                <p className="font-semibold text-gray-800">
                    {message ?? 'Widget nog niet geconfigureerd'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    Klik op de widget in de schermkaart om dit in te vullen
                </p>
            </div>
        </div>
    );
}
