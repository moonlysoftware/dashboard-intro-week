import { useEffect, useState } from 'react';
import WidgetNotConfigured from '@/Components/Widgets/WidgetNotConfigured';

interface ImageWidgetProps {
    config: {
        selected_images?: string[];
        transition_time?: number;
        image_positions?: Record<string, number>;
    };
    data: Record<string, any>;
}

export default function ImageWidget({ config }: ImageWidgetProps) {
    const images = config.selected_images ?? [];
    const transitionTime = config.transition_time ?? 5;
    const imagePositions = config.image_positions ?? {};

    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            // Fade out
            setVisible(false);

            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % images.length);
                // Fade in
                setVisible(true);
            }, 700);
        }, transitionTime * 1000);

        return () => clearInterval(interval);
    }, [images.length, transitionTime]);

    if (images.length === 0) {
        return <WidgetNotConfigured message="Geen afbeeldingen geselecteerd" />;
    }

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
            <img
                key={currentIndex}
                src={images[currentIndex]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    objectPosition: `center ${imagePositions[images[currentIndex]] ?? 0}%`,
                    opacity: visible ? 1 : 0,
                    transition: 'opacity 0.7s ease-in-out',
                }}
            />
        </div>
    );
}
