import { useRef, useState } from 'react';
import axios from 'axios';
import { Field, TextInput, SaveButton, AddButton } from './Ui';

export interface PersonRecord {
    id: number;
    name: string;
    photo: string | null;
    birth_date: string;
    jubileum_start_date: string | null;
}

interface Props {
    persons: PersonRecord[];
    onPersonsChange: (persons: PersonRecord[]) => void;
}

function PersonAvatar({ person, size = 40 }: { person: PersonRecord; size?: number }) {
    if (person.photo) {
        return (
            <img
                src={person.photo}
                alt={person.name}
                className="rounded-full object-cover shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }
    const initials = person.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div
            className="rounded-full bg-[#6C52FF]/20 flex items-center justify-center shrink-0 text-[#6C52FF] font-bold"
            style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
            {initials}
        </div>
    );
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

const EMPTY_FORM = {
    name: '',
    birth_date: '',
    jubileum_start_date: '',
};

function PersonForm({
    initial,
    onSave,
    onBack,
    saving,
}: {
    initial: Partial<typeof EMPTY_FORM> & { photo?: string | null };
    onSave: (data: typeof EMPTY_FORM, photo: File | null) => Promise<void>;
    onBack: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photo ?? null);
    const fileRef = useRef<HTMLInputElement>(null);

    const set = <K extends keyof typeof EMPTY_FORM>(k: K, v: string) =>
        setForm((f) => ({ ...f, [k]: v }));

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    return (
        <div className="space-y-5">
            <button type="button" onClick={onBack} className="text-[#6C52FF] hover:underline text-sm font-medium">
                ← Terug
            </button>

            {/* Photo */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    {photoPreview ? (
                        <img
                            src={photoPreview}
                            alt=""
                            className="w-20 h-20 rounded-full object-cover border-2 border-[#e6e2f4]"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-[#f3f1fb] border-2 border-dashed border-[#c9c4e8] flex items-center justify-center text-[#b0abc8] text-xs text-center px-1">
                            Geen foto
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="rounded-lg border border-[#e6e2f4] bg-[#f3f1fb] px-3 py-2 text-sm font-medium text-[#6C52FF] hover:bg-[#6C52FF]/10 transition-colors block"
                    >
                        {photoPreview ? 'Foto wijzigen' : 'Foto uploaden'}
                    </button>
                    {photoPreview && (
                        <button
                            type="button"
                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                            className="text-xs text-[#DD2727] hover:underline"
                        >
                            Foto verwijderen
                        </button>
                    )}
                </div>
            </div>

            <Field label="Naam">
                <TextInput
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Naam medewerker"
                />
            </Field>

            <Field label="Geboortedatum">
                <TextInput
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => set('birth_date', e.target.value)}
                />
            </Field>

            <Field label="Jubileum startdatum" hint="Optioneel — datum waarop deze persoon bij Moonly begon.">
                <TextInput
                    type="date"
                    value={form.jubileum_start_date}
                    onChange={(e) => set('jubileum_start_date', e.target.value)}
                />
            </Field>

            <div className="pt-2">
                <SaveButton onClick={() => onSave(form, photoFile)} saving={saving} />
            </div>
        </div>
    );
}

function PersonCard({
    person,
    onEdit,
    onDelete,
}: {
    person: PersonRecord;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="rounded-2xl border border-[#e6e2f4] bg-white overflow-hidden">
            <div className="flex items-center gap-3 p-3">
                <PersonAvatar person={person} size={48} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1a1430] truncate">{person.name}</p>
                    <p className="text-xs text-[#8b84a8] truncate">🎂 {formatDate(person.birth_date)}</p>
                    {person.jubileum_start_date && (
                        <p className="text-xs text-[#6C52FF] truncate">🏆 {formatDate(person.jubileum_start_date)}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-end gap-0.5 px-3 pb-2.5 border-t border-[#f0eefa]">
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-lg bg-[#f3f1fb] px-2.5 py-1 text-xs font-semibold text-[#6C52FF] hover:bg-[#6C52FF]/10 transition-colors"
                >
                    Bewerk
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1.5 text-[#b0abc8] hover:text-[#DD2727] transition-colors"
                    title="Verwijder"
                >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export function BirthdayManager({ persons, onPersonsChange }: Props) {
    const [editing, setEditing] = useState<PersonRecord | 'new' | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async (form: typeof EMPTY_FORM, photo: File | null) => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('birth_date', form.birth_date);
            if (form.jubileum_start_date) fd.append('jubileum_start_date', form.jubileum_start_date);
            if (photo) fd.append('photo', photo);

            if (editing === 'new') {
                const res = await axios.post(route('birthday-people.store'), fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                onPersonsChange([...persons, res.data]);
            } else if (editing) {
                const res = await axios.post(route('birthday-people.update', editing.id), fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                onPersonsChange(persons.map((p) => (p.id === editing.id ? res.data : p)));
            }
            setEditing(null);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (person: PersonRecord) => {
        if (!confirm(`"${person.name}" verwijderen?`)) return;
        await axios.delete(route('birthday-people.destroy', person.id));
        onPersonsChange(persons.filter((p) => p.id !== person.id));
    };

    if (editing !== null) {
        const initial = editing === 'new'
            ? {}
            : {
                name: editing.name,
                birth_date: editing.birth_date,
                jubileum_start_date: editing.jubileum_start_date ?? '',
                photo: editing.photo,
            };

        return (
            <PersonForm
                initial={initial}
                onSave={handleSave}
                onBack={() => setEditing(null)}
                saving={saving}
            />
        );
    }

    return (
        <div className="space-y-4">
            {persons.length === 0 && (
                <p className="text-center text-sm text-[#8b84a8] py-8">
                    Nog geen personen. Voeg er een toe!
                </p>
            )}
            <div className="grid grid-cols-2 gap-3">
                {persons.map((person) => (
                    <PersonCard
                        key={person.id}
                        person={person}
                        onEdit={() => setEditing(person)}
                        onDelete={() => handleDelete(person)}
                    />
                ))}
            </div>
            <AddButton onClick={() => setEditing('new')} label="Persoon toevoegen" />
        </div>
    );
}
