import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Badge, Button, Spinner } from "@/components/ui";
import { booksApi, loansApi, type Book, type Loan } from "@/lib/api";
import { ArrowLeft, BookOpen, Calendar, User } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function BookDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState<Book | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      booksApi.get(+id),
      loansApi.list({ book_id: +id, per_page: 50 }),
    ]).then(([b, l]) => {
      setBook(b.data);
      setLoans(l.data.loans);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="flex justify-center py-32"><Spinner className="w-8 h-8" /></div></Layout>;
  if (!book) return <Layout><div className="p-8 text-[#b94040]">Book not found.</div></Layout>;

  return (
    <Layout>
      <div className="px-8 py-8 max-w-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#1a1208]/50 hover:text-[#1a1208] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to books
        </button>

        {/* Book card */}
        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#f0b429]/15 rounded-xl">
              <BookOpen className="w-8 h-8 text-[#c8860a]" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-[#1a1208]">{book.title}</h1>
              <p className="text-[#1a1208]/60 mt-0.5">{book.author}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {book.genre && <Badge color="gray">{book.genre}</Badge>}
                {book.published_year && <Badge color="gray">{book.published_year}</Badge>}
                <Badge color={book.avail_copies > 0 ? "green" : "red"}>
                  {book.avail_copies} of {book.total_copies} available
                </Badge>
              </div>
              {book.description && (
                <p className="text-sm text-[#1a1208]/60 mt-3 leading-relaxed">{book.description}</p>
              )}
              {book.isbn && (
                <p className="font-mono text-xs text-[#1a1208]/30 mt-2">ISBN: {book.isbn}</p>
              )}
            </div>
          </div>
        </div>

        {/* Loan history */}
        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8d8b8]">
            <h2 className="font-display text-lg font-semibold text-[#1a1208]">Loan History</h2>
          </div>
          {loans.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#1a1208]/40">No loans for this book yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8d8b8] bg-[#fdf8f0]">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Borrowed</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Due</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Fine</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id} className="border-b border-[#e8d8b8]/50 hover:bg-[#fdf8f0]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#1a1208]/30" />
                        {loan.member_name}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/60">
                      {format(parseISO(loan.borrowed_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/60">
                      {format(parseISO(loan.due_date), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={loan.status === "overdue" ? "red" : loan.status === "active" ? "green" : "gray"}>
                        {loan.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {loan.fine_amount > 0 ? (
                        <span className="text-[#b94040] font-semibold">${loan.fine_amount.toFixed(2)}</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
