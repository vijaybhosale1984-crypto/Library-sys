import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Badge, Spinner } from "@/components/ui";
import { membersApi, loansApi, type Member, type Loan } from "@/lib/api";
import { ArrowLeft, User, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function MemberDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [member, setMember] = useState<Member | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      membersApi.get(+id),
      loansApi.list({ member_id: +id, per_page: 50 }),
    ]).then(([m, l]) => {
      setMember(m.data);
      setLoans(l.data.loans);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="flex justify-center py-32"><Spinner className="w-8 h-8" /></div></Layout>;
  if (!member) return <Layout><div className="p-8 text-[#b94040]">Member not found.</div></Layout>;

  const activeLoans = loans.filter(l => l.status !== "returned");
  const pastLoans   = loans.filter(l => l.status === "returned");

  return (
    <Layout>
      <div className="px-8 py-8 max-w-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#1a1208]/50 hover:text-[#1a1208] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to members
        </button>

        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#4a7c59]/15 rounded-xl">
              <User className="w-8 h-8 text-[#4a7c59]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#1a1208]">{member.name}</h1>
              <p className="text-[#1a1208]/60">{member.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge color={member.is_active ? "green" : "gray"}>{member.is_active ? "Active" : "Inactive"}</Badge>
                {member.phone && <Badge color="gray">{member.phone}</Badge>}
              </div>
              {member.address && <p className="text-sm text-[#1a1208]/50 mt-2">{member.address}</p>}
              <p className="text-xs text-[#1a1208]/30 mt-2 font-mono">
                Member since {format(parseISO(member.member_since), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Active loans */}
        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-[#e8d8b8]">
            <h2 className="font-display text-lg font-semibold text-[#1a1208]">
              Currently Borrowing
              {activeLoans.length > 0 && (
                <span className="ml-2 text-sm font-body font-normal text-[#c8860a]">({activeLoans.length})</span>
              )}
            </h2>
          </div>
          {activeLoans.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#1a1208]/40">No active loans</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8d8b8] bg-[#fdf8f0]">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Book</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Due</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Fine</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map(loan => (
                  <tr key={loan.id} className="border-b border-[#e8d8b8]/50">
                    <td className="px-5 py-3 font-medium">{loan.book_title}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/60">{format(parseISO(loan.due_date), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3"><Badge color={loan.status === "overdue" ? "red" : "green"}>{loan.status}</Badge></td>
                    <td className="px-5 py-3">{loan.fine_amount > 0 ? <span className="text-[#b94040]">${loan.fine_amount.toFixed(2)}</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Past loans */}
        {pastLoans.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8d8b8]">
              <h2 className="font-display text-lg font-semibold text-[#1a1208]">Past Loans</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8d8b8] bg-[#fdf8f0]">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Book</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Returned</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Fine</th>
                </tr>
              </thead>
              <tbody>
                {pastLoans.map(loan => (
                  <tr key={loan.id} className="border-b border-[#e8d8b8]/50">
                    <td className="px-5 py-3">{loan.book_title}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#1a1208]/60">{loan.returned_at ? format(parseISO(loan.returned_at), "MMM d, yyyy") : "—"}</td>
                    <td className="px-5 py-3">{loan.fine_amount > 0 ? `$${loan.fine_amount.toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
