import type { ReactNode } from "react";

interface SlideHeaderProps {
    children: ReactNode;
}

export function SlideHeader({ children }: SlideHeaderProps) {
    return (
        <h1 className="font-poster font-bold text-white leading-none text-5xl mb-7">
            {children}
        </h1>
    );
}

interface SlideLayoutProps {
    title?: ReactNode;
    children: ReactNode;
}

export function SlideLayout({ title, children }: SlideLayoutProps) {
    return (
        <div className="h-full flex flex-col px-14 pt-9 pb-9">
            {title != null && title !== "" && (
                <SlideHeader>{title}</SlideHeader>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </div>
    );
}
