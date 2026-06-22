import { useState, useCallback, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { SlideshowEditor } from '@/Components/Management/SlideshowEditor';
import { GeneralEditor } from '@/Components/Management/GeneralEditor';
import { TechnicalEditor } from '@/Components/Management/TechnicalEditor';
import { OverlayEditor } from '@/Components/Management/OverlayEditor';
import { Field, TextInput, SaveButton, Divider } from '@/Components/Management/Ui';
import { CreateScreenDialog } from '@/Components/Screens/CreateScreenDialog';
import axios from 'axios';
import { notifyDisplayRefresh } from '@/lib/displayRefresh';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenType = 'slideshow' | 'general' | 'technical';

interface SlideWidget {
    id: number;
    widget_type: 'agenda' | 'birthdays' | 'appreciation' | 'announcement';
    grid_order: number;
    config: Record<string, any> | null;
}

interface MgmtWidget {
    id: number;
    widget_type: string;
    grid_order: number;
    config: Record<string, any> | null;
}

interface MgmtScreen {
    id: number;
    name: string;
    description: string | null;
    refresh_interval: number;
    screen_type: ScreenType;
    screen_config: Record<string, any> | null;
    widgets: MgmtWidget[];
    widgets_count: number;
}

interface ManagementIndexProps {
    screens: MgmtScreen[];
    overlay: {
        rooms: RoomConfig[];
        legacy_rooms: RoomConfig[];
        calendar_configured: boolean;
        calendar_credentials_path?: string;
    };
}

interface RoomConfig {
    id?: string;
    name: string;
    calendar_id?: string;
    subtext?: string;
}

type Tab = 'content' | 'settings';
type ViewMode = 'screen' | 'overlay';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SCREEN_ICONS: Record<ScreenType, string> = {
    slideshow: '📺',
    general: '🧩',
    technical: '📡',
};

const SCREEN_LABELS: Record<ScreenType, string> = {
    slideshow: 'Slideshow',
    general: 'Statisch',
    technical: 'Status & Sport',
};

function Sidebar({
    screens,
    activeScreenId,
    viewMode,
    onSelect,
    onSelectOverlay,
    onNewScreen,
}: {
    screens: MgmtScreen[];
    activeScreenId: number | null;
    viewMode: ViewMode;
    onSelect: (id: number) => void;
    onSelectOverlay: () => void;
    onNewScreen: () => void;
}) {
    return (
        <aside className="w-56 flex-none border-r border-[#e6e2f4] bg-[#f8f6fd] flex flex-col h-full">
            <div className="p-4 border-b border-[#e6e2f4]">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-[#1a1430]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                        MOONLY
                    </span>
                    <span className="text-[10px] bg-[#6C52FF]/10 text-[#6C52FF] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                        mgmt
                    </span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#b0abc8]">
                    Schermen
                </p>
                {screens.map((screen) => (
                    <button
                        key={screen.id}
                        type="button"
                        onClick={() => onSelect(screen.id)}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${
                            viewMode === 'screen' && activeScreenId === screen.id
                                ? 'bg-[#6C52FF] text-white'
                                : 'text-[#1a1430] hover:bg-[#e6e2f4]'
                        }`}
                    >
                        <span className="text-base leading-none">{SCREEN_ICONS[screen.screen_type] ?? '📺'}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{screen.name}</p>
                            <p className={`text-[11px] truncate ${viewMode === 'screen' && activeScreenId === screen.id ? 'text-white/70' : 'text-[#8b84a8]'}`}>
                                {SCREEN_LABELS[screen.screen_type] ?? screen.screen_type}
                            </p>
                        </div>
                    </button>
                ))}

                <div className="pt-1">
                    <button
                        type="button"
                        onClick={onNewScreen}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#6C52FF] hover:bg-[#6C52FF]/10 transition-all"
                    >
                        <span className="text-base leading-none">＋</span>
                        <span className="text-sm font-semibold">Nieuw scherm</span>
                    </button>
                </div>
            </nav>

            <div className="px-3 pb-2">
                <p className="px-2 pt-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#b0abc8]">
                    Overlay
                </p>
                <button
                    type="button"
                    onClick={onSelectOverlay}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${
                        viewMode === 'overlay'
                            ? 'bg-[#6C52FF] text-white'
                            : 'text-[#1a1430] hover:bg-[#e6e2f4]'
                    }`}
                >
                    <span className="text-base leading-none">🏢</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">Vergaderruimtes</p>
                        <p className={`text-[11px] truncate ${viewMode === 'overlay' ? 'text-white/70' : 'text-[#8b84a8]'}`}>
                            Slideshow & Statisch
                        </p>
                    </div>
                </button>
            </div>

            <div className="p-3 border-t border-[#e6e2f4]">
                <a
                    href={route('settings.index')}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#5b5478] hover:bg-[#e6e2f4] transition-all"
                >
                    <span className="text-base">⚙️</span>
                    <span className="text-sm font-semibold">Instellingen</span>
                </a>
            </div>
        </aside>
    );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ screen, activeTab, onTab }: { screen: MgmtScreen; activeTab: Tab; onTab: (t: Tab) => void }) {
    const contentLabel =
        screen.screen_type === 'slideshow' ? 'Slides' :
        screen.screen_type === 'general' ? 'Inhoud' :
        'Status';

    const tabs: { id: Tab; label: string }[] = [
        { id: 'content', label: contentLabel },
        { id: 'settings', label: 'Instellingen' },
    ];

    return (
        <div className="flex gap-0 border-b border-[#e6e2f4] px-5 bg-white shrink-0">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTab(tab.id)}
                    className={`px-3 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                        activeTab === tab.id
                            ? 'border-[#6C52FF] text-[#6C52FF]'
                            : 'border-transparent text-[#5b5478] hover:text-[#1a1430]'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ─── Settings editor ──────────────────────────────────────────────────────────

function SettingsEditor({ screen }: { screen: MgmtScreen }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: screen.name,
        description: screen.description ?? '',
        screen_type: screen.screen_type,
    });

    const save = () => {
        patch(route('screens.update', screen.id), {
            preserveScroll: true,
            onSuccess: () => notifyDisplayRefresh(screen.id),
        });
    };

    return (
        <div className="space-y-5">
            <Field label="Naam">
                <TextInput
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Scherm naam"
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </Field>
            <Field label="Beschrijving">
                <TextInput
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Optionele beschrijving"
                />
            </Field>
            <div className="pt-2">
                <SaveButton onClick={save} saving={processing} />
            </div>
            <Divider />
            <div>
                <p className="text-xs font-semibold text-[#DD2727] uppercase tracking-wide mb-3">Gevaarlijke zone</p>
                <button
                    type="button"
                    onClick={() => {
                        if (confirm(`Scherm "${screen.name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
                            router.delete(route('screens.destroy', screen.id));
                        }
                    }}
                    className="rounded-lg border border-[#DD2727]/30 px-4 py-2 text-sm font-semibold text-[#DD2727] hover:bg-[#DD2727]/5 transition-colors"
                >
                    Scherm verwijderen
                </button>
            </div>
        </div>
    );
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({ screen }: { screen: MgmtScreen | null }) {
    if (!screen) {
        return (
            <div className="w-72 flex-none border-l border-[#e6e2f4] bg-[#f8f6fd] flex items-center justify-center">
                <p className="text-sm text-[#b0abc8]">Selecteer een scherm</p>
            </div>
        );
    }

    const displayUrl = route('display.show', screen.id);

    return (
        <div className="w-72 flex-none border-l border-[#e6e2f4] bg-[#f8f6fd] flex flex-col">
            <div className="p-3 border-b border-[#e6e2f4] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#5b5478] uppercase tracking-widest">Live preview</span>
                <a
                    href={displayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#6C52FF] hover:underline font-medium"
                >
                    Volledig scherm ↗
                </a>
            </div>
            <div className="p-3 space-y-2">
                {/* 16:9 iframe */}
                <div
                    className="relative w-full rounded-xl overflow-hidden border border-[#e6e2f4] shadow-sm bg-[#050215]"
                    style={{ paddingBottom: '56.25%' }}
                >
                    <iframe
                        key={screen.id}
                        src={displayUrl}
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 'none', pointerEvents: 'none' }}
                        title={`Preview: ${screen.name}`}
                    />
                </div>
                <p className="text-[10px] text-[#b0abc8] text-center">
                    Ververs na opslaan in beheer
                </p>
                <a
                    href={displayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[#e6e2f4] bg-white py-2 text-xs font-semibold text-[#5b5478] hover:border-[#6C52FF] hover:text-[#6C52FF] transition-colors"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M5 1H1v10h10V7M7 1h4m0 0v4M4.5 7.5l6.5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Open display
                </a>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Index({ screens: initialScreens, overlay: initialOverlay }: ManagementIndexProps) {
    const [screens, setScreens] = useState<MgmtScreen[]>(initialScreens);
    const [overlayRooms, setOverlayRooms] = useState<RoomConfig[]>(initialOverlay.rooms ?? []);
    const [createOpen, setCreateOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('screen');

    // Persist active screen / overlay view in URL
    const [activeScreenId, setActiveScreenId] = useState<number | null>(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'overlay') return null;
        const id = params.get('active');
        const parsed = id ? parseInt(id, 10) : null;
        return parsed && initialScreens.some((s) => s.id === parsed)
            ? parsed
            : initialScreens[0]?.id ?? null;
    });

    const [activeTab, setActiveTab] = useState<Tab>('content');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'overlay') {
            setViewMode('overlay');
        }
    }, []);

    // Keep screens in sync with Inertia page data
    useEffect(() => {
        setScreens(initialScreens);
    }, [initialScreens]);

    useEffect(() => {
        setOverlayRooms(initialOverlay.rooms ?? []);
    }, [initialOverlay.rooms]);

    const handleSelectScreen = (id: number) => {
        setViewMode('screen');
        setActiveScreenId(id);
        setActiveTab('content');
        window.history.replaceState(null, '', `?active=${id}`);
    };

    const handleSelectOverlay = () => {
        setViewMode('overlay');
        window.history.replaceState(null, '', '?view=overlay');
    };

    const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;
    const screenConfig = activeScreen?.screen_config ?? {};

    const updateScreenConfig = useCallback((screenId: number, cfg: Record<string, any>) => {
        setScreens((prev) =>
            prev.map((s) => (s.id === screenId ? { ...s, screen_config: cfg } : s))
        );
    }, []);

    const updateSlides = useCallback((screenId: number, slides: SlideWidget[]) => {
        setScreens((prev) =>
            prev.map((s) => (s.id === screenId ? { ...s, widgets: slides } : s))
        );
    }, []);

    const updateWidgets = useCallback((screenId: number, widgets: MgmtWidget[]) => {
        setScreens((prev) =>
            prev.map((s) => (s.id === screenId ? { ...s, widgets } : s))
        );
    }, []);

    const slides = (activeScreen?.widgets ?? []).filter((w) =>
        ['agenda', 'birthdays', 'appreciation', 'announcement'].includes(w.widget_type)
    ) as SlideWidget[];

    return (
        <div className="flex h-screen overflow-hidden bg-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <Head title="Beheer" />

            <Sidebar
                screens={screens}
                activeScreenId={activeScreenId}
                viewMode={viewMode}
                onSelect={handleSelectScreen}
                onSelectOverlay={handleSelectOverlay}
                onNewScreen={() => setCreateOpen(true)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {viewMode === 'overlay' ? (
                    <>
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e6e2f4] bg-white shrink-0">
                            <span className="text-2xl leading-none">🏢</span>
                            <div>
                                <h1 className="text-sm font-bold text-[#1a1430]">Overlay</h1>
                                <p className="text-xs text-[#8b84a8]">Vergaderruimtes voor slideshow & statisch</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <OverlayEditor
                                rooms={overlayRooms}
                                legacyRooms={initialOverlay.legacy_rooms}
                                calendarConfigured={initialOverlay.calendar_configured}
                                onRoomsChange={setOverlayRooms}
                            />
                        </div>
                    </>
                ) : activeScreen ? (
                    <>
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e6e2f4] bg-white shrink-0">
                            <span className="text-2xl leading-none">{SCREEN_ICONS[activeScreen.screen_type]}</span>
                            <div>
                                <h1 className="text-sm font-bold text-[#1a1430]">{activeScreen.name}</h1>
                                <p className="text-xs text-[#8b84a8]">{SCREEN_LABELS[activeScreen.screen_type]}</p>
                            </div>
                        </div>

                        <TabBar screen={activeScreen} activeTab={activeTab} onTab={setActiveTab} />

                        <div className="flex-1 overflow-y-auto p-5">
                            {activeTab === 'content' && activeScreen.screen_type === 'slideshow' && (
                                <SlideshowEditor
                                    screenId={activeScreen.id}
                                    slides={slides}
                                    onSlidesChange={(updated) => updateSlides(activeScreen.id, updated)}
                                />
                            )}
                            {activeTab === 'content' && activeScreen.screen_type === 'general' && (
                                <GeneralEditor
                                    screenId={activeScreen.id}
                                    widgets={activeScreen.widgets}
                                    screenConfig={screenConfig}
                                    onWidgetsChange={(updated) => updateWidgets(activeScreen.id, updated)}
                                    onConfigChange={(cfg) => updateScreenConfig(activeScreen.id, cfg)}
                                />
                            )}
                            {activeTab === 'content' && activeScreen.screen_type === 'technical' && (
                                <TechnicalEditor
                                    screenId={activeScreen.id}
                                    screenConfig={screenConfig}
                                    onConfigChange={(cfg) => updateScreenConfig(activeScreen.id, cfg)}
                                />
                            )}
                            {activeTab === 'settings' && (
                                <SettingsEditor screen={activeScreen} />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <p className="text-4xl">📺</p>
                            <p className="text-[#5b5478] font-semibold">Geen scherm geselecteerd</p>
                            <button
                                type="button"
                                onClick={() => setCreateOpen(true)}
                                className="rounded-lg bg-[#6C52FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a42e8] transition-colors"
                            >
                                Scherm aanmaken
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PreviewPanel screen={viewMode === 'screen' ? activeScreen : null} />

            <CreateScreenDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}
