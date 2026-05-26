import Link from "next/link";
import { useRouter } from "next/router";
import { BookOpen, Users, BookMarked, LayoutDashboard, Library } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/",        label: "Dashboard", icon: LayoutDashboard },
  { href: "/books",   label: "Books",     icon: BookOpen },
  { href: "/members", label: "Members",   icon: Users },
  { href: "/loans",   label: "Loans",     icon: BookMarked },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-[#1a1208] text-[#fdf8f0] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Library className="w-7 h-7 text-[#f0b429]" />
            <div>
              <div className="font-display font-bold text-lg leading-tight">Athenaeum</div>
              <div className="text-xs text-white/40 font-body">Library Manager</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-[#f0b429]/20 text-[#f0b429]"
                    : "text-white/60 hover:bg-white/8 hover:text-white/90"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10 text-xs text-white/25">
          v1.0.0 — REST + Protobuf
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-[#fdf8f0]">
        {children}
      </main>
    </div>
  );
}
