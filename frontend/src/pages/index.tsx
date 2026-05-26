import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { StatCard, Spinner, Badge } from "@/components/ui";
import { dashboardApi, loansApi, type DashboardStats, type Loan } from "@/lib/api";
import { BookOpen, Users, BookMarked, AlertTriangle, DollarSign } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      loansApi.list({ status: "active", per_page: 6 }),
    ]).then(([s, l]) => {
      setStats(s.data);
      setRecentLoans(l.data.loans);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Spinner className="w-8 h-8" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-8 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#1a1208]">Good morning 📚</h1>
          <p className="text-sm text-[#1a1208]/50 mt-1">Here's what's happening at the library today.</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Books"    value={stats.total_books}    icon={BookOpen}      color="ink" />
            <StatCard label="Active Members" value={stats.total_members}  icon={Users}         color="sage" />
            <StatCard label="Active Loans"   value={stats.active_loans}   icon={BookMarked}    color="amber" />
            <StatCard label="Overdue"        value={stats.overdue_loans}  icon={AlertTriangle} color="rust" />
          </div>
        )}

        {/* Fines banner */}
        {stats && stats.total_fines > 0 && (
          <div className="mb-8 flex items-center gap-3 bg-[#b94040]/8 border border-[#b94040]/20 rounded-xl px-5 py-3">
            <DollarSign className="w-4 h-4 text-[#b94040]" />
            <span className="text-sm text-[#b94040] font-medium">
              Outstanding fines: <strong>${stats.total_fines.toFixed(2)}</strong>
            </span>
          </div>
        )}

        {/* Active loans table */}
        <div className="bg-white rounded-2xl border border-[#e8d8b8] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8d8b8]">
            <h2 className="font-display text-lg font-semibold text-[#1a1208]">Active Loans</h2>
            <Link href="/loans" className="text-xs text-[#c8860a] font-semibold hover:underline">View all →</Link>
          </div>
          {recentLoans.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#1a1208]/40">No active loans</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8d8b8] bg-[#fdf8f0]">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Book</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Due Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#1a1208]/50">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-[#e8d8b8]/50 hover:bg-[#fdf8f0]/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-[#1a1208]">{loan.book_title}</td>
                    <td className="px-6 py-3 text-[#1a1208]/70">{loan.member_name}</td>
                    <td className="px-6 py-3 font-mono text-xs text-[#1a1208]/60">
                      {format(parseISO(loan.due_date), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-3">
                      <Badge color={loan.status === "overdue" ? "red" : loan.status === "active" ? "green" : "gray"}>
                        {loan.status}
                      </Badge>
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
