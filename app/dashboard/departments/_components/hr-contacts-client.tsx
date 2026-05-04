"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Star, X } from "lucide-react";

import { createHrContact, updateHrContact, deleteHrContact } from "@/app/dashboard/departments/_actions/members";

export interface HrContactRow {
  id: string;
  name: string;
  title: string;
  category: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  sort_order: number;
}

const PRESET_CATEGORIES = [
  "General Questions",
  "Benefits",
  "Payroll",
  "Safety",
  "Scheduling",
  "Onboarding",
];

interface FormState {
  name: string;
  title: string;
  category: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

const EMPTY: FormState = { name: "", title: "", category: "General Questions", email: "", phone: "", is_primary: false };

function ContactForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (v: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [v, setV] = useState(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Name *</label>
          <input value={v.name} onChange={set("name")} placeholder="Maria Garcia" maxLength={100}
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Title *</label>
          <input value={v.title} onChange={set("title")} placeholder="HR Coordinator" maxLength={100}
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Category *</label>
          <div className="flex gap-2">
            <select value={PRESET_CATEGORIES.includes(v.category) ? v.category : "__custom"}
              onChange={(e) => {
                if (e.target.value !== "__custom") setV((prev) => ({ ...prev, category: e.target.value }));
              }}
              className="flex-1 rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none">
              {PRESET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              {!PRESET_CATEGORIES.includes(v.category) && <option value="__custom">{v.category}</option>}
            </select>
          </div>
          {!PRESET_CATEGORIES.includes(v.category) && (
            <input value={v.category} onChange={set("category")} placeholder="Custom category" maxLength={80}
              className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Email</label>
          <input type="email" value={v.email} onChange={set("email")} placeholder="hr@company.com"
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Phone</label>
          <input type="tel" value={v.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" maxLength={30}
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none" />
        </div>

        <div className="flex items-center gap-2 self-end pb-1">
          <input
            id="is-primary"
            type="checkbox"
            checked={v.is_primary}
            onChange={(e) => setV((prev) => ({ ...prev, is_primary: e.target.checked }))}
            className="size-4 rounded border-[color:var(--dc-edge)] accent-(--color-brand)"
          />
          <label htmlFor="is-primary" className="text-sm text-dc-text-2 cursor-pointer">
            Primary contact
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button onClick={onCancel} disabled={saving}
          className="rounded-md px-3 py-1.5 text-sm text-dc-text-2 hover:text-dc-text disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={() => onSave(v)}
          disabled={saving || !v.name.trim() || !v.title.trim() || !v.category.trim()}
          className="flex items-center gap-1.5 rounded-md bg-(--color-brand) px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save contact"}
        </button>
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
  deleting,
}: {
  contact: HrContactRow;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const initials = contact.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`relative flex items-start gap-3 rounded-xl border p-4 ${contact.is_primary ? "border-(--color-brand)/30 bg-(--color-brand)/5" : "border-[color:var(--dc-edge)] bg-dc-raised"}`}>
      {contact.is_primary && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-(--color-brand)/15 px-2 py-0.5">
          <Star className="size-2.5 fill-(--color-brand) text-(--color-brand)" />
          <span className="text-[10px] font-semibold text-(--color-brand)">Primary</span>
        </div>
      )}

      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-sm font-semibold text-purple-400" aria-hidden>
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 pr-16">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-dc-text">{contact.name}</p>
            <p className="text-xs text-dc-text-3">{contact.title}</p>
          </div>
        </div>
        <span className="mt-1 inline-block rounded-full border border-[color:var(--dc-edge)] bg-dc-surface px-2 py-0.5 text-[10px] font-medium text-dc-text-2">
          {contact.category}
        </span>
        {(contact.email || contact.phone) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-dc-text-2">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1">
        <button onClick={onEdit} aria-label={`Edit ${contact.name}`}
          className="rounded-md p-1.5 text-dc-text-3 hover:text-dc-text hover:bg-dc-surface transition-colors">
          <Pencil className="size-3.5" />
        </button>
        <button onClick={onDelete} disabled={deleting} aria-label={`Delete ${contact.name}`}
          className="rounded-md p-1.5 text-dc-text-3 hover:text-(--color-signal-urgent) hover:bg-(--color-signal-urgent)/10 transition-colors disabled:opacity-50">
          {deleting ? <X className="size-3.5 animate-pulse" /> : <Trash2 className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function HrContactsClient({ initial }: { initial: HrContactRow[] }) {
  const [contacts, setContacts] = useState<HrContactRow[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toForm(c: HrContactRow): FormState {
    return { name: c.name, title: c.title, category: c.category, email: c.email ?? "", phone: c.phone ?? "", is_primary: c.is_primary };
  }

  function handleAdd(v: FormState) {
    setError(null);
    startTransition(async () => {
      const res = await createHrContact({
        name: v.name.trim(), title: v.title.trim(), category: v.category.trim(),
        email: v.email.trim() || null, phone: v.phone.trim() || null,
        is_primary: v.is_primary, sort_order: contacts.length,
      });
      if (!res.ok) { setError("Could not save contact. Try again."); return; }
      setContacts((prev) => [...prev, {
        id: res.data.id, name: v.name.trim(), title: v.title.trim(), category: v.category.trim(),
        email: v.email.trim() || null, phone: v.phone.trim() || null,
        is_primary: v.is_primary, sort_order: prev.length,
      }]);
      setAdding(false);
    });
  }

  function handleEdit(id: string, v: FormState) {
    setError(null);
    startTransition(async () => {
      const res = await updateHrContact(id, {
        name: v.name.trim(), title: v.title.trim(), category: v.category.trim(),
        email: v.email.trim() || null, phone: v.phone.trim() || null, is_primary: v.is_primary,
      });
      if (!res.ok) { setError("Could not update contact. Try again."); return; }
      setContacts((prev) => prev.map((c) => c.id === id
        ? { ...c, name: v.name.trim(), title: v.title.trim(), category: v.category.trim(), email: v.email.trim() || null, phone: v.phone.trim() || null, is_primary: v.is_primary }
        : c));
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteHrContact(id);
      setDeletingId(null);
      if (!res.ok) { setError("Could not delete contact. Try again."); return; }
      setContacts((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="mt-8 border-t border-[color:var(--dc-edge)] pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-dc-text-3 uppercase">HR Contacts</p>
          <p className="mt-0.5 text-xs text-dc-text-3">
            Shown as cards at the bottom of onboarding SOPs and in the worker HR directory.
          </p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 text-xs font-semibold text-(--color-brand) hover:bg-(--color-brand)/20">
            <Plus className="size-3.5" /> Add contact
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {contacts.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:var(--dc-edge)] px-6 py-8 text-center">
            <p className="text-sm font-medium text-dc-text">No HR contacts yet</p>
            <p className="text-xs text-dc-text-3">Add contacts for Benefits, Payroll, General Questions, etc.</p>
            <button onClick={() => setAdding(true)}
              className="mt-2 flex items-center gap-1.5 rounded-md bg-(--color-brand) px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
              <Plus className="size-3.5" /> Add first contact
            </button>
          </div>
        )}

        {contacts.map((c) =>
          editingId === c.id ? (
            <ContactForm key={c.id} initial={toForm(c)}
              onSave={(v) => handleEdit(c.id, v)}
              onCancel={() => setEditingId(null)}
              saving={isPending} />
          ) : (
            <ContactCard key={c.id} contact={c}
              onEdit={() => setEditingId(c.id)}
              onDelete={() => handleDelete(c.id)}
              deleting={deletingId === c.id} />
          )
        )}

        {adding && (
          <ContactForm initial={EMPTY} onSave={handleAdd} onCancel={() => setAdding(false)} saving={isPending} />
        )}
      </div>
    </div>
  );
}
