import { ChevronDown } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

export interface GridSize {
    cols: number;
    rows: number;
}

const GRID_SIZES: GridSize[] = [
    { cols: 2, rows: 1 },
    { cols: 2, rows: 2 },
    { cols: 3, rows: 1 },
    { cols: 3, rows: 2 },
    { cols: 3, rows: 3 },
    { cols: 4, rows: 1 },
    { cols: 4, rows: 2 },
    { cols: 4, rows: 3 },
    { cols: 4, rows: 4 },
    { cols: 6, rows: 1 },
    { cols: 6, rows: 2 },
];

interface GridSizeSelectorProps {
    currentColSpan: number;
    currentRowSpan: number;
    onSizeChange: (cols: number, rows: number) => void;
    maxColSpan?: number;
    maxRowSpan?: number;
    supportedSizes?: GridSize[];
    widgetType?: string;
}

export function GridSizeSelector({
    currentColSpan,
    currentRowSpan,
    onSizeChange,
    maxColSpan = 6,
    maxRowSpan = 5,
    supportedSizes,
    widgetType,
}: GridSizeSelectorProps) {
    // Use widget-specific supported sizes if provided, otherwise use all available sizes
    const baseAvailableSizes = supportedSizes || GRID_SIZES;

    // Further filter based on max constraints
    const availableSizes = baseAvailableSizes.filter(
        (size) => size.cols <= maxColSpan && size.rows <= maxRowSpan,
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted-foreground/20"
                    title="Change widget size"
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {availableSizes.map((size) => (
                    <DropdownMenuItem
                        key={`${size.cols}x${size.rows}`}
                        onClick={() => onSizeChange(size.cols, size.rows)}
                        className={`cursor-pointer ${
                            currentColSpan === size.cols &&
                            currentRowSpan === size.rows
                                ? "bg-primary/10"
                                : ""
                        }`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="font-medium">
                                {size.cols}×{size.rows}
                            </span>
                            {currentColSpan === size.cols &&
                                currentRowSpan === size.rows && (
                                    <span className="text-xs text-primary font-semibold ml-2">
                                        ✓
                                    </span>
                                )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
