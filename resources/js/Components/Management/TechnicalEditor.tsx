import { useState } from "react";
import axios from "axios";
import { notifyDisplayRefresh } from "@/lib/displayRefresh";
import {
    Field,
    TextInput,
    Segmented,
    RowCard,
    AddButton,
    SaveButton,
    SectionTitle,
    Divider,
} from "./Ui";

interface ServiceConfig {
    id: string;
    name: string;
    kind: string;
    status: "up" | "warn" | "down";
    note: string;
}

interface Props {
    screenId: number;
    screenConfig: Record<string, any>;
    onConfigChange: (cfg: Record<string, any>) => void;
}

const STATUS_OPTIONS = [
    { value: "up", label: "Operationeel" },
    { value: "warn", label: "Verstoord" },
    { value: "down", label: "Storing" },
];

const DEFAULT_SERVICES: ServiceConfig[] = [
    {
        id: "dashboard",
        name: "Dashboard",
        kind: "Webapplicatie",
        status: "up",
        note: "Alle endpoints reageren",
    },
    {
        id: "database",
        name: "Database",
        kind: "MySQL",
        status: "up",
        note: "Connectie stabiel",
    },
    {
        id: "toggl",
        name: "Toggl sync",
        kind: "Integratie",
        status: "up",
        note: "Uren worden elk uur gesynchroniseerd",
    },
    {
        id: "calendar",
        name: "Google Calendar",
        kind: "Integratie",
        status: "up",
        note: "Vergaderruimtes actueel",
    },
];

function initialServices(config: Record<string, any>): ServiceConfig[] {
    const raw = config.services ?? [];
    if (!raw.length) return DEFAULT_SERVICES;

    return raw.map((s: any, i: number) => ({
        id: s.id ?? `svc-${i}`,
        name: s.name ?? "",
        kind: s.kind ?? s.url ?? "",
        status: s.status ?? "up",
        note: s.note ?? "",
    }));
}

export function TechnicalEditor({
    screenId,
    screenConfig,
    onConfigChange,
}: Props) {
    const [services, setServices] = useState<ServiceConfig[]>(() =>
        initialServices(screenConfig),
    );
    const [sportTitle, setSportTitle] = useState<string>(
        screenConfig.sportTitle ?? "Sport",
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(
                route("screens.updateConfig", screenId),
                {
                    screen_config: { ...screenConfig, services, sportTitle },
                },
            );
            onConfigChange(res.data.screen_config);
            notifyDisplayRefresh(screenId);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const addService = () =>
        setServices([
            ...services,
            {
                id: `svc-${Date.now()}`,
                name: "",
                kind: "",
                status: "up",
                note: "",
            },
        ]);
    const updateService = (i: number, p: Partial<ServiceConfig>) =>
        setServices(services.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
    const removeService = (i: number) =>
        setServices(services.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-6">
            <SectionTitle>Services</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
                {/* Services are not editable in the editor */}
                <div className="rounded-xl border border-[#e6e2f4] bg-[#f8f7fd] p-4 space-y-1.5">
                    <p className="text-xs font-bold text-[#5b5478] uppercase tracking-wide">
                        Services
                    </p>
                    <p className="text-sm text-[#6b6490]">
                        Services worden niet beheerd in de editor.
                    </p>
                </div>
            </div>
        </div>
    );
}
