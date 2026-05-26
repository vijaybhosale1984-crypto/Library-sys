import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button, Input, Textarea, Select, Modal, Badge, Spinner, Empty, PageHeader } from "@/components/ui";
import { booksApi, type Book } from "@/lib/api";
import { Plus, Search, Edit2, Trash2, BookOpen } from "lucide-react";
import { useRouter } from "next/router";

const GENRES = ["Fiction", "Non-Fiction", "Sci-Fi", "Dystopian", "Romance", "Mystery", "Biography", "History", "Self-Help", "Other"];

function BookForm({ initial, onSave, onClose }: {
  initial?: Partial<Book>;
  onSave: (data: Partial<Book>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Book>>(initial || { total_copies: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof Book, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.author) { setError("Title and author are required"); return; }
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
        <Input label="Title *"  value={form.title || ""}  onChange={e => set("title", e.target.value)} className="col-span-2" />
        <Input label="Author *" value={form.author || ""} onChange={e => set("author", e.target.value)} />
        <Input label="ISBN"     value={form.isbn || ""}   onChange={e => set("isbn", e.target.value)} />
        <Select label="Genre" value={form.genre || ""} onChange={e => set("genre", e.target.value)}>
          <option value="">— Select —</option>
          {GENRES.map(g => <option key={g}>{g}</option>)}
        </Select>
        <Input label="Year" type="number" value={form.published_year || ""} onChange={e => set("published_year", +e.target.value)} />
        <Input label="Copies" type="number" min={1} value={form.total_copies || 1} onChange={e => set("total_copies", +e.target.value)} />
      </div>
      <Textarea label="Description" value={form.description || ""} onChange={e => set("description", e.target.value)} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>{initial?.id ? "Save changes" : "Add book"}</Button>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | Book | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await booksApi.list(page, 15, search);
    setBooks(r.data.books);
    setTotal(r.data.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<Book>) => {
    if (typeof modal === "object" && modal !== null) {
      await booksApi.update(modal.id, data);
    } else {
      await booksApi.create(data);
    }
    load();
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Delete "${book.title}"?`)) return;
    try { await booksApi.delete(book.id); load(); }
    catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Cannot delete");
    }
  };

  const pages = Math.ceil(total / 15);

  return (
    <Layout>
      <div className="px-8 py-8">
        <PageHeader
          title="Books"
          subtitle={`${total} book${total !== 1 ? "s" : ""} in the catalogue`}
          action={
            <Button onClick={() => setModal("create")}>
              <Plus className="w-4 h-4" /> Add book
            </Button>
          }
        />

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1208]/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title, author, ISBN…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#e8d8b8] bg-white focus:outline-none focus:ring-2 focus:ring-[#c8860a]/30"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : books.length === 0 ? (
            <Empty message="No books found" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8d8b8] bg-[#fdf8f0]">
                  {["Title / Author", "ISBN", "Genre", "Year", "Copies", "Available", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr
                    key={book.id}
                    className="border-b border-[#e8d8b8]/50 hover:bg-[#fdf8f0] transition-colors cursor-pointer"
                    onClick={() => router.push(`/books/${book.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#1a1208]">{book.title}</div>
                      <div className="text-xs text-[#1a1208]/50">{book.author}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/50">{book.isbn || "—"}</td>
                    <td className="px-5 py-3">
                      {book.genre ? <Badge color="gray">{book.genre}</Badge> : "—"}
                    </td>
                    <td className="px-5 py-3 text-[#1a1208]/60">{book.published_year || "—"}</td>
                    <td className="px-5 py-3 text-[#1a1208]/70">{book.total_copies}</td>
                    <td className="px-5 py-3">
                      <Badge color={book.avail_copies > 0 ? "green" : "red"}>
                        {book.avail_copies} / {book.total_copies}
                      </Badge>
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setModal(book)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(book)}>
                          <Trash2 className="w-3.5 h-3.5 text-[#b94040]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center gap-2 mt-4 justify-end">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <span className="text-sm text-[#1a1208]/50">Page {page} / {pages}</span>
            <Button variant="secondary" size="sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={typeof modal === "object" && modal !== null ? "Edit Book" : "Add New Book"}
      >
        <BookForm
          initial={typeof modal === "object" && modal !== null ? modal : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      </Modal>
    </Layout>
  );
}
