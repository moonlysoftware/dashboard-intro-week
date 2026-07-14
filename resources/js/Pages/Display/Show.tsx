import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useStageScale } from '@/Components/Display/Shell';
import SlideshowDisplay from '@/Components/Display/SlideshowDisplay';
import GeneralDisplay from '@/Components/Display/GeneralDisplay';
import TechnicalDisplay from '@/Components/Display/TechnicalDisplay';
import { subscribeDisplayRefresh } from '@/lib/displayRefresh';
import type { ScreenConfig, ScreenType } from '@/types';

interface Widget {
    id: number;
    widget_type: string;
    config: Record<string, any> | null;
    grid_col_span: number;
    grid_row_span: number;
    grid_order: number;
    data: any;
}

interface Screen {
    id: number;
    name: string;
    screen_type?: ScreenType;
    screen_config?: ScreenConfig;
    widgets: Widget[];
}

interface DisplayShowProps {
    screen: Screen;
}

function normalizeScreenConfig(config: unknown): ScreenConfig {
    if (config && typeof config === 'object' && !Array.isArray(config)) {
        return config as ScreenConfig;
    }
    return {};
}

export default function Show({ screen: initialScreen }: DisplayShowProps) {
    const [widgets, setWidgets] = useState<Widget[]>(initialScreen.widgets || []);
    const [screenType, setScreenType] = useState<ScreenType>(initialScreen.screen_type ?? 'slideshow');
    const [screenConfig, setScreenConfig] = useState<ScreenConfig>(
        normalizeScreenConfig(initialScreen.screen_config),
    );
    const scale = useStageScale();

    const fetchData = useCallback(async () => {
        try {
            const response = await axios.get(route('display.data', initialScreen.id));
            const d = response.data;
            setWidgets(d.widgets ?? []);
            if (d.screen_type) setScreenType(d.screen_type);
            if (d.screen_config !== undefined) setScreenConfig(normalizeScreenConfig(d.screen_config));
        } catch (error) {
            console.error('Error fetching display data:', error);
        }
    }, [initialScreen.id]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        return () => {
            document.body.style.overflow = '';
            document.body.style.margin = '';
        };
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        return subscribeDisplayRefresh(initialScreen.id, fetchData);
    }, [initialScreen.id, fetchData]);

    useEffect(() => {
        const id = setInterval(fetchData, 60 * 60_000);
        return () => clearInterval(id);
    }, [fetchData]);

    const displayProps = { widgets, screenConfig };

    return (
        <>
            <Head title={`Display: ${initialScreen.name}`} />

            <div id="moonly-stage-wrap" className="overflow-hidden">
                <div
                    id="moonly-stage"
                    style={{ transform: `scale(${scale || 1})` }}
                >
                    {screenType === 'general' ? (
                        <GeneralDisplay {...displayProps} />
                    ) : screenType === 'technical' ? (
                        <TechnicalDisplay screenConfig={screenConfig} />
                    ) : (
                        <SlideshowDisplay {...displayProps} />
                    )}
                </div>
            </div>
        </>
    );
}
