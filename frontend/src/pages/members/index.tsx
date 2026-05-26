import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button, Input, Textarea, Modal, Badge, Spinner, Empty, PageHeader } from "@/components/ui";
import { membersApi, type Member } from "@/lib/api";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { format, parseISO } from "date-fns";

function MemberForm({ initial, onSave, onClose }: {
  initial?: Partial<Member>;
  onSave: (data: Partial<Member>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Member>>(initial || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof Member, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save";
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-[#b94040] bg-[#b94040]/10 rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name *" value={form.name || ""} onChange={e => set("name", e.target.value)} className="col-span-2" />
        <Input label="Email *"     value={form.email || ""} onChange={e => set("email", e.target.value)} type="email" className="col-span-2" />
        <Input label="Phone"       value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
      </div>
      <Textarea label="Address" value={form.address || ""} onChange={e => set("address", e.target.value)} />
      {initial?.id && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_active ?? true} onChange={e => set("is_active", e.target.checked)} className="rounded" />
          Active member
        </label>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>{initial?.id ? "Save changes" : "Add member"}</Button>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | Member | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await membersApi.list(page, 15, search);
    setMembers(r.data.members);
    setTotal(r.data.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<Member>) => {
    if (typeof modal === "object" && modal !== null) {
      await membersApi.update(modal.id, data);
    } else {
      await membersApi.create(data);
    }
    load();
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(`Remove ${m.name}?`)) return;
    try { await membersApi.delete(m.id); load(); }
    catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Cannot delete");
    }
  };

  const pages = Math.ceil(total / 15);

  return (
    <Layout>
      <div className="px-8 py-8">
        <PageHeader
          title="Members"
          subtitle={`${total} registered member${total !== 1 ? "s" : ""}`}
          action={
            <Button onClick={() => setModal("create")}>
              <Plus className="w-4 h-4" /> Add member
            </Button>
          }
        />

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1208]/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#e8d8b8] bg-white focus:outline-none focus:ring-2 focus:ring-[#c8860a]/30"
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : members.length === 0 ? (
            <Empty message="No members found" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8d8b8] bg-[#fdf8f0]">
                  {["Name", "Email", "Phone", "Member Since", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr
                    key={m.id}
                    className="border-b border-[#e8d8b8]/50 hover:bg-[#fdf8f0] transition-colors cursor-pointer"
                    onClick={() => router.push(`/members/${m.id}`)}
                  >
                    <td className="px-5 py-3 font-medium text-[#1a1208]">{m.name}</td>
                    <td className="px-5 py-3 text-[#1a1208]/60">{m.email}</td>
                    <td className="px-5 py-3 text-[#1a1208]/50">{m.phone || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/50">
                      {format(parseISO(m.member_since), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={m.is_active ? "green" : "gray"}>{m.is_active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setModal(m)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}><Trash2 className="w-3.5 h-3.5 text-[#b94040]" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center gap-2 mt-4 justify-end">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <span className="text-sm text-[#1a1208]/50">Page {page} / {pages}</span>
            <Button variant="secondary" size="sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        )}
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={typeof modal === "object" && modal !== null ? "Edit Member" : "Add New Member"}
      >
        <MemberForm
          initial={typeof modal === "object" && modal !== null ? modal : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      </Modal>
    </Layout>
  );
}
