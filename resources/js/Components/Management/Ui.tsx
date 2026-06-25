import {
    ReactNode,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
    useRef,
    useState,
} from "react";
import axios from "axios";

// --- Layout atoms ----------------------------------------------------------

export function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5b5478]">
                {label}
            </label>
            {children}
            {hint && <p className="text-xs text-[#8b84a8]">{hint}</p>}
        </div>
    );
}

export function TextInput({
    className = "",
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`w-full rounded-lg border border-[#e6e2f4] bg-white px-3 py-2 text-sm text-[#1a1430] placeholder:text-[#b0abc8] focus:border-[#6C52FF] focus:outline-none focus:ring-2 focus:ring-[#6C52FF]/20 ${className}`}
        />
    );
}

export function TextArea({
    className = "",
    ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={`w-full rounded-lg border border-[#e6e2f4] bg-white px-3 py-2 text-sm text-[#1a1430] placeholder:text-[#b0abc8] focus:border-[#6C52FF] focus:outline-none focus:ring-2 focus:ring-[#6C52FF]/20 resize-none ${className}`}
        />
    );
}

export function NumberInput({
    className = "",
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            type="number"
            {...props}
            className={`w-full rounded-lg border border-[#e6e2f4] bg-white px-3 py-2 text-sm text-[#1a1430] focus:border-[#6C52FF] focus:outline-none focus:ring-2 focus:ring-[#6C52FF]/20 ${className}`}
        />
    );
}

export function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label?: string;
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-[#6C52FF]" : "bg-[#d4d0e8]"}`}
            >
                <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`}
                />
            </button>
            {label && <span className="text-sm text-[#1a1430]">{label}</span>}
        </label>
    );
}

export function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex rounded-lg border border-[#e6e2f4] bg-[#f3f1fb] p-0.5 gap-0.5">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                        value === opt.value
                            ? "bg-white text-[#6C52FF] shadow-sm"
                            : "text-[#5b5478] hover:text-[#1a1430]"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export function RowCard({
    children,
    onDelete,
}: {
    children: ReactNode;
    onDelete?: () => void;
}) {
    return (
        <div className="relative rounded-xl border border-[#e6e2f4] bg-white p-4 space-y-3">
            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    className="absolute right-3 top-3 text-[#b0abc8] hover:text-[#DD2727] transition-colors"
                    title="Verwijder"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                            d="M1 1l12 12M13 1L1 13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}
            {children}
        </div>
    );
}

export function AddButton({
    onClick,
    label = "Toevoegen",
}: {
    onClick: () => void;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c9c4e8] py-3 text-sm font-medium text-[#6C52FF] hover:border-[#6C52FF] hover:bg-[#6C52FF]/5 transition-all"
        >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                    d="M7 1v12M1 7h12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
            {label}
        </button>
    );
}

export function SaveButton({
    onClick,
    saving,
    saved,
}: {
    onClick: () => void;
    saving?: boolean;
    saved?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={saving}
            className="rounded-lg bg-[#6C52FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a42e8] disabled:opacity-60 transition-colors"
        >
            {saving ? "Opslaan…" : saved ? "✓ Opgeslagen" : "Opslaan"}
        </button>
    );
}

export function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#5b5478] mb-3">
            {children}
        </h3>
    );
}

export function Divider() {
    return <div className="border-t border-[#e6e2f4]" />;
}

function useImageUpload(onChange: (url: string) => void) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await axios.post(route("image-widget.store"), formData);
            onChange(res.data.url);
        } catch (err: any) {
            const msg: string =
                err.response?.status === 419
                    ? "Sessie verlopen. Vernieuw de pagina en probeer opnieuw."
                    : err.response?.data?.errors?.image?.[0] ??
                      err.response?.data?.message ??
                      "Upload mislukt.";
            setError(msg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return { uploading, error, fileInputRef, handleUpload };
}

export function ImagePreviewPanel({
    value,
    onChange,
    label,
    hint,
}: {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    hint?: string;
}) {
    const { uploading, error, fileInputRef, handleUpload } =
        useImageUpload(onChange);

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#5b5478]">
                    {label}
                </label>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
            />
            {value ? (
                <div className="relative aspect-video overflow-hidden rounded-xl border border-[#e6e2f4] bg-[#f3f1fb]">
                    <img
                        src={value}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>
            ) : (
                <div className="aspect-video rounded-xl border-2 border-dashed border-[#e6e2f4] bg-[#f8f6fd] flex items-center justify-center">
                    <p className="text-xs text-[#b0abc8] text-center px-4">
                        Geen afbeelding
                    </p>
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-lg border border-[#e6e2f4] bg-[#f3f1fb] px-3 py-2 text-sm font-medium text-[#6C52FF] hover:bg-[#6C52FF]/10 disabled:opacity-60 transition-colors"
                >
                    {uploading
                        ? "Uploaden…"
                        : value
                          ? "Afbeelding wijzigen"
                          : "Afbeelding uploaden"}
                </button>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="rounded-lg border border-[#DD2727]/30 bg-[#DD2727]/10 px-3 py-2 text-sm font-medium text-[#DD2727] hover:bg-[#DD2727]/20 transition-colors"
                    >
                        Verwijder
                    </button>
                )}
            </div>
            {hint && <p className="text-xs text-[#8b84a8]">{hint}</p>}
            {error && <p className="text-xs text-[#DD2727]">{error}</p>}
        </div>
    );
}

export function FormWithImagePreview({
    imageUrl,
    onImageChange,
    imageLabel = "Achtergrondafbeelding",
    imageHint,
    children,
}: {
    imageUrl: string;
    onImageChange: (url: string) => void;
    imageLabel?: string;
    imageHint?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
            <div className="space-y-4 min-w-0">{children}</div>
            <ImagePreviewPanel
                value={imageUrl}
                onChange={onImageChange}
                label={imageLabel}
                hint={imageHint}
            />
        </div>
    );
}

/** Standalone upload + preview column. */
export function ImageUploadField(props: {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    hint?: string;
}) {
    return <ImagePreviewPanel {...props} />;
}
