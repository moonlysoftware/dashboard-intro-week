export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type ScreenType = "slideshow" | "general" | "technical";

export interface RoomConfig {
    id: string;
    name: string;
    calendar_id?: string;
    free: boolean;
    /** HH:MM — when the current status ends (free until next booking, or busy until available) */
    until?: string | null;
    status?: "available" | "occupied" | "unknown";
    sub?: string;
    /** @deprecated editor-only manual fallback */
    busy?: boolean;
    /** @deprecated editor-only manual fallback */
    subtext?: string;
}

export interface WeatherData {
    temperature: number;
    condition: string;
}

export interface ScreenConfig {
    rooms?: RoomConfig[];
    weather?: WeatherData;
    cycleSeconds?: number;
    // Technical screen
    services?: ServiceConfig[];
    sportTitle?: string;
    live?: LiveMatch[];
    fixtures?: Fixture[];
}

export interface ServiceConfig {
    id: string;
    name: string;
    kind: string;
    status: "up" | "warn" | "down";
    note: string;
}

export interface LiveMatch {
    id: string;
    comp: string;
    home: string;
    away: string;
    hs: number;
    as: number;
    min: string;
}

export interface Fixture {
    id: string;
    comp: string;
    label: string;
    when: string;
}

export interface SharedScreen {
    id: number;
    name: string;
    description: string | null;
    refresh_interval: number;
    screen_type?: ScreenType;
    screen_config?: ScreenConfig;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    screens: SharedScreen[];
};
