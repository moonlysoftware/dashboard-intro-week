import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { WidgetLibraryPanel } from "./WidgetLibraryPanel";

interface WidgetLibraryAccordionProps {
    widgetTypes: Record<string, string>;
    onWidgetTypeClick?: (widgetType: string) => void;
}

export function WidgetLibraryAccordion({
    widgetTypes,
    onWidgetTypeClick,
}: WidgetLibraryAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-40">
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 max-h-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-archia text-sm font-semibold">
                            Widgets
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <WidgetLibraryPanel
                            widgetTypes={widgetTypes}
                            onWidgetTypeClick={(widgetType) => {
                                onWidgetTypeClick?.(widgetType);
                            }}
                        />
                    </div>
                </div>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full h-14 w-32 p-0 shadow-lg"
                size="icon"
            >
                <ChevronDown
                    className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </Button>
        </div>
    );
}
