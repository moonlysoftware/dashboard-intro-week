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

export interface F1NextRace {
    competition: { name: string; location?: { country?: string } };
    circuit?: { name: string };
    date: string;
    time?: string;
    circuit_coords?: [number, number][] | null;
}

export interface F1RaceResult {
    position: number;
    driver: { name: string; abbr?: string };
    team?: { name: string; colour?: string };
}

export interface ArgoCDApp {
    name: string;
    project: string;
    health: "Healthy" | "Degraded" | "Progressing" | "Suspended" | "Missing" | "Unknown";
    sync: "Synced" | "OutOfSync" | "Unknown";
    operation?: string | null;
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
    argocd_apps?: ArgoCDApp[];
    f1_next_race?: F1NextRace | null;
    f1_results?: F1RaceResult[];
    f1_results_label?: string | null;
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
