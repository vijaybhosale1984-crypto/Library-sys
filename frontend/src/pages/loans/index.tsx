import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button, Select, Modal, Badge, Spinner, Empty, PageHeader } from "@/components/ui";
import { loansApi, booksApi, membersApi, type Loan, type Book, type Member } from "@/lib/api";
import { Plus, RotateCcw, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";

function BorrowModal({ onSave, onClose }: {
  onSave: (bookId: number, memberId: number, days: number) => Promise<void>;
  onClose: () => void;
}) {
  const [books, setBooks]     = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [bookId, setBookId]   = useState(0);
  const [memberId, setMemberId] = useState(0);
  const [days, setDays]       = useState(14);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    booksApi.list(1, 100).then(r => setBooks(r.data.books.filter(b => b.avail_copies > 0)));
    membersApi.list(1, 100).then(r => setMembers(r.data.members.filter(m => m.is_active)));
  }, []);

  const submit = async () => {
    if (!bookId || !memberId) { setError("Select both a book and a member"); return; }
    setSaving(true);
    try { await onSave(bookId, memberId, days); onClose(); }
    catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed";
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-[#b94040] bg-[#b94040]/10 rounded-lg px-3 py-2">{error}</div>}
      <Select label="Book *" value={bookId} onChange={e => setBookId(+e.target.value)}>
        <option value={0}>— Select a book —</option>
        {books.map(b => (
          <option key={b.id} value={b.id}>{b.title} ({b.avail_copies} avail.)</option>
        ))}
      </Select>
      <Select label="Member *" value={memberId} onChange={e => setMemberId(+e.target.value)}>
        <option value={0}>— Select a member —</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </Select>
      <Select label="Loan Period" value={days} onChange={e => setDays(+e.target.value)}>
        {[7, 14, 21, 30].map(d => <option key={d} value={d}>{d} days</option>)}
      </Select>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Confirm Borrow</Button>
      </div>
    </div>
  );
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showBorrow, setShowBorrow] = useState(false);
  const [returning, setReturning] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await loansApi.list({ status, page, per_page: 15 });
    setLoans(r.data.loans);
    setTotal(r.data.total);
    setLoading(false);
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const handleReturn = async (loanId: number) => {
    if (!confirm("Mark this book as returned?")) return;
    setReturning(loanId);
    try { await loansApi.return(loanId); load(); }
    catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed");
    } finally { setReturning(null); }
  };

  const handleBorrow = async (bookId: number, memberId: number, days: number) => {
    await loansApi.borrow(bookId, memberId, days);
    load();
  };

  const pages = Math.ceil(total / 15);

  return (
    <Layout>
      <div className="px-8 py-8">
        <PageHeader
          title="Loans"
          subtitle={`${total} loan${total !== 1 ? "s" : ""}`}
          action={
            <Button onClick={() => setShowBorrow(true)}>
              <Plus className="w-4 h-4" /> Borrow a book
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {(["", "active", "overdue", "returned"] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                status === s
                  ? "bg-[#1a1208] text-[#fdf8f0]"
                  : "bg-[#f0e6d0] text-[#1a1208]/60 hover:bg-[#e8d8b8]"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : loans.length === 0 ? (
            <Empty message="No loans found" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8d8b8] bg-[#fdf8f0]">
                  {["Book", "Member", "Borrowed", "Due Date", "Status", "Fine", "Action"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id} className="border-b border-[#e8d8b8]/50 hover:bg-[#fdf8f0]">
                    <td className="px-5 py-3 font-medium text-[#1a1208] max-w-[160px] truncate">{loan.book_title}</td>
                    <td className="px-5 py-3 text-[#1a1208]/70">{loan.member_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/50">
                      {format(parseISO(loan.borrowed_at), "MMM d")}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/60">
                      {format(parseISO(loan.due_date), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {loan.status === "overdue" && <AlertTriangle className="w-3.5 h-3.5 text-[#b94040]" />}
                        <Badge color={loan.status === "overdue" ? "red" : loan.status === "active" ? "green" : "gray"}>
                          {loan.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {loan.fine_amount > 0
                        ? <span className="text-[#b94040] font-semibold text-xs">${loan.fine_amount.toFixed(2)}</span>
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {loan.status !== "returned" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={returning === loan.id}
                          onClick={() => handleReturn(loan.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Return
                        </Button>
                      )}
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

      <Modal open={showBorrow} onClose={() => setShowBorrow(false)} title="Borrow a Book">
        <BorrowModal onSave={handleBorrow} onClose={() => setShowBorrow(false)} />
      </Modal>
    </Layout>
  );
}
