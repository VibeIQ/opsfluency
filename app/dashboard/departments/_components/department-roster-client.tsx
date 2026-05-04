"use client";

import { useState, useTransition } from "react";
import { Phone, UserRoundX, Check, X } from "lucide-react";

import {
  removeMemberFromDepartment,
  updateMemberRole,
  updateMemberContactPhone,
} from "@/app/dashboard/departments/_actions/members";

export interface RosterMember {
  id: string;
  clerk_user_id: string;
  role: string;
  contact_phone: string | null;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
}

interface Props {
  departmentId: string;
  initial: RosterMember[];
  unassigned: RosterMember[];
}

function Avatar({ member }: { member: RosterMember }) {
  const initials = (member.displayName ?? member.email).slice(0, 2).toUpperCase();
  return member.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={member.imageUrl} alt={member.displayName ?? member.email}
      className="size-8 shrink-0 rounded-full border border-[color:var(--dc-edge)] object-cover" />
  ) : (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised text-xs font-semibold text-dc-text-3 uppercase">
      {initials}
    </div>
  );
}

function PhoneEditor({
  memberId,
  initial,
}: {
  memberId: string;
  initial: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await updateMemberContactPhone({ member_id: memberId, contact_phone: value.trim() || null });
      if (res.ok) { setSaved(value.trim()); setEditing(false); }
    });
  }

  function cancel() { setValue(saved); setEditing(false); }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs text-dc-text-3 hover:text-dc-text transition-colors"
      >
        <Phone className="size-3" />
        {saved || <span className="italic">Add phone</span>}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Phone className="size-3 shrink-0 text-dc-text-3" />
      <input
        autoFocus
        type="tel"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        placeholder="+1 (555) 000-0000"
        maxLength={30}
        className="w-36 rounded border border-[color:var(--dc-edge)] bg-dc-surface px-2 py-0.5 text-xs text-dc-text focus:border-(--color-brand) focus:outline-none"
      />
      <button onClick={save} disabled={isPending} aria-label="Save"
        className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
        <Check className="size-3.5" />
      </button>
      <button onClick={cancel} aria-label="Cancel" className="text-dc-text-3 hover:text-dc-text">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function RoleToggle({ member, onRoleChange }: { member: RosterMember; onRoleChange: (id: string, role: "manager" | "employee") => void }) {
  const [isPending, startTransition] = useTransition();
  if (member.role === "admin") return <span className="rounded-full border border-[color:var(--dc-edge)] px-2 py-0.5 text-xs font-medium text-dc-text-3">Admin</span>;

  const isManager = member.role === "manager";
  const next = isManager ? "employee" : "manager";

  function toggle() {
    startTransition(async () => {
      const res = await updateMemberRole({ member_id: member.id, role: next });
      if (res.ok) onRoleChange(member.id, next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={`Switch to ${next}`}
      className={[
        "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50",
        isManager
          ? "border-(--color-brand)/30 bg-(--color-brand)/10 text-(--color-brand) hover:bg-(--color-brand)/20"
          : "border-[color:var(--dc-edge)] bg-dc-raised text-dc-text-3 hover:text-dc-text hover:bg-dc-overlay",
      ].join(" ")}
    >
      {isManager ? "Manager" : "Employee"}
    </button>
  );
}

export function DepartmentRosterClient({ departmentId, initial, unassigned }: Props) {
  const [members, setMembers] = useState<RosterMember[]>(initial);
  const [availableToAdd, setAvailableToAdd] = useState<RosterMember[]>(unassigned);

  function handleRoleChange(id: string, role: "manager" | "employee") {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m));
  }

  async function handleRemove(formData: FormData) {
    const memberId = formData.get("member_id") as string;
    await removeMemberFromDepartment(formData);
    const removed = members.find((m) => m.id === memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (removed) setAvailableToAdd((prev) => [...prev, removed]);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Assigned members ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-3">
          <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
            Assigned members
          </p>
        </div>

        {!members.length ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-dc-text-2">No members assigned yet.</p>
            <p className="mt-1 text-xs text-dc-text-3">Use the form below to add members.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--dc-edge)]">
            {members.map((member) => (
              <li key={member.id} className="px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar member={member} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-dc-text">
                        {member.displayName ?? member.email}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-dc-text-3">
                        {member.displayName ? member.email : ""}
                      </p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex shrink-0 items-center gap-2">
                    <RoleToggle member={member} onRoleChange={handleRoleChange} />
                    <form action={handleRemove}>
                      <input type="hidden" name="department_id" value={departmentId} />
                      <input type="hidden" name="member_id" value={member.id} />
                      <button type="submit"
                        className="flex items-center gap-1 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-2.5 py-1 text-xs font-semibold text-(--color-signal-urgent) hover:bg-(--color-signal-urgent)/20">
                        <UserRoundX className="size-3" strokeWidth={2} /> Remove
                      </button>
                    </form>
                  </div>
                </div>

                {/* Contact phone — only for managers */}
                {member.role === "manager" && (
                  <div className="mt-2 pl-11">
                    <PhoneEditor memberId={member.id} initial={member.contact_phone} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Add member ───────────────────────────────────────────────────── */}
      {availableToAdd.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
          <div className="border-b border-[color:var(--dc-edge)] px-5 py-3">
            <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">Add member</p>
          </div>
          <form action={async (fd) => {
            await (await import("@/app/dashboard/departments/_actions/members")).assignMemberToDepartment(fd);
            const memberId = fd.get("member_id") as string;
            const added = availableToAdd.find((m) => m.id === memberId);
            if (added) {
              setMembers((prev) => [...prev, added]);
              setAvailableToAdd((prev) => prev.filter((m) => m.id !== memberId));
            }
          }} className="flex flex-wrap items-end gap-3 px-5 py-4">
            <input type="hidden" name="department_id" value={departmentId} />
            <label className="flex flex-1 flex-col gap-1.5 min-w-[180px]">
              <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">Select member</span>
              <select name="member_id" required
                className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none">
                <option value="">Choose a member…</option>
                {availableToAdd.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName ? `${m.displayName} — ${m.email}` : m.email} ({m.role})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20">
              Assign
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-5 py-4 text-center">
          <p className="text-sm text-dc-text-2">All company members are already assigned to this department.</p>
        </div>
      )}
    </div>
  );
}
