"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

// Context for admin role
interface AdminCtx {
    roles: string[];
    permissions: string[];
    userName: string;
    userEmail: string;
    hasPerm: (perm: string) => boolean;
}
const AdminContext = createContext<AdminCtx>({ roles: [], permissions: [], userName: "", userEmail: "", hasPerm: () => false });
export const useAdmin = () => useContext(AdminContext);

// Nav items with permission-based access
const NAV_ITEMS = [
    { href: "/admin", labelKey: "dashboard", icon: "📊", perm: "dashboard.view" },
    { href: "/admin/posts", labelKey: "posts", icon: "📝", perm: "posts.view" },
    { href: "/admin/posts/new", labelKey: "newPost", icon: "✏️", perm: "posts.create" },
    { href: "/admin/approvals", labelKey: "approvals", icon: "✅", perm: "approvals.view" },
    { href: "/admin/activities", labelKey: "activities", icon: "📅", perm: "activities.view" },
    { href: "/admin/activities/new", labelKey: "newActivity", icon: "🎯", perm: "activities.create" },
    { href: "/admin/users", labelKey: "users", icon: "👥", perm: "users.view" },
    { href: "/admin/members", labelKey: "members", icon: "🧑‍🤝‍🧑", perm: "members.view" },
    { href: "/admin/projects", labelKey: "projects", icon: "🚀", perm: "projects.view" },
    { href: "/admin/messages", labelKey: "messages", icon: "💬", perm: "messages.view" },
    { href: "/admin/roles", labelKey: "roles", icon: "🛡️", perm: "roles.view" },
    { href: "/admin/ai-knowledge", labelKey: "aiKnowledge", icon: "🧠", perm: "ai.view" },
    { href: "/admin/settings", labelKey: "settings", icon: "⚙️", perm: "settings.view" },
    { href: "/admin/audit", labelKey: "auditLog", icon: "🔒", perm: "audit.view" },
];

function AdminShell({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [permLoaded, setPermLoaded] = useState(false);
    const t = useTranslations("AdminLayout");

    const roles: string[] = (session?.user as any)?.roles || [(session?.user as any)?.role || 'member'];
    const userName = session?.user?.name || "";
    const userEmail = session?.user?.email || "";

    const isAdmin = roles.includes('admin');

    const hasPerm = (perm: string): boolean => {
        if (isAdmin || permissions.includes('*')) return true;
        return permissions.includes(perm);
    };

    // Strip locale prefix for matching
    const cleanPath = pathname.replace(/^\/(en|ku|ar)/, "");

    // If on login page, render children directly (no sidebar)
    if (cleanPath === "/admin/login") {
        return <>{children}</>;
    }

    // Fetch permissions from DB
    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/permissions')
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data) {
                        setPermissions(data.permissions || []);
                    }
                    setPermLoaded(true);
                })
                .catch(() => setPermLoaded(true));
        }
    }, [status]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/admin/login");
        }
    }, [status, router]);

    const hasAdminAccess = isAdmin || (permLoaded && permissions.length > 0);

    useEffect(() => {
        if (status === "authenticated" && permLoaded && !hasAdminAccess) {
            router.push("/");
        }
    }, [status, hasAdminAccess, permLoaded, router]);

    // Close sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    if (status === "loading" || (status === "authenticated" && !permLoaded)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#00171F]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#003459] to-[#00A8E8] flex items-center justify-center animate-pulse">
                        <span className="text-lg font-black text-white">NC</span>
                    </div>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00A8E8]"></div>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated" || !hasAdminAccess) return null;

    const visibleNav = NAV_ITEMS.filter((item) => hasPerm(item.perm));

    const primaryRole = roles[0] || 'member';

    return (
        <AdminContext.Provider value={{ roles, permissions, userName, userEmail, hasPerm }}>
            <div className="min-h-screen bg-[#00171F] flex">
                {/* Mobile overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <aside
                    className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#00171F]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    {/* Logo */}
                    <div className="p-5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#003459] to-[#00A8E8] flex items-center justify-center shadow-lg shadow-[#00A8E8]/20">
                                <span className="text-sm font-black text-white">NC</span>
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-sm">NICER Club</h1>
                                <span className="text-[#00A8E8] text-xs font-medium capitalize">{primaryRole.replace('_', ' ')} {t("panel")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {visibleNav.map((item) => {
                            const isActive =
                                cleanPath === item.href ||
                                (item.href !== "/admin" && cleanPath.startsWith(item.href));
                            const isExactDashboard = item.href === "/admin" && cleanPath === "/admin";
                            const active = item.href === "/admin" ? isExactDashboard : isActive;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        active
                                            ? "bg-[#007EA7]/20 text-[#00A8E8] shadow-sm shadow-[#007EA7]/10"
                                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                                    }`}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span>{t(item.labelKey)}</span>
                                    {active && (
                                        <motion.div
                                            layoutId="admin-nav-indicator"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00A8E8]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-white/[0.06]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#003459] to-[#007EA7] flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                    {userName?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{userName}</p>
                                <p className="text-slate-500 text-xs truncate">{userEmail}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {t("signOut")}
                        </button>
                    </div>
                </aside>

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-h-screen lg:min-w-0">
                    {/* Top bar (mobile) */}
                    <header className="lg:hidden sticky top-0 z-30 bg-[#00171F]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl text-white hover:bg-white/[0.06] transition-colors"
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#003459] to-[#00A8E8] flex items-center justify-center">
                                <span className="text-xs font-black text-white">NC</span>
                            </div>
                            <span className="text-white font-bold text-sm">{t("admin")}</span>
                        </div>
                        <div className="w-10" /> {/* spacer */}
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AdminContext.Provider>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AdminShell>{children}</AdminShell>
        </SessionProvider>
    );
}
