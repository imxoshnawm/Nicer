"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const t = useTranslations("Navigation");
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "/", label: t("home") },
        { href: "/about", label: t("about") },
        { href: "/news", label: t("news") },
        { href: "/activities", label: t("activities") },
        { href: "/members", label: t("members") },
        { href: "/projects", label: t("projects") },
        { href: "/contact", label: t("contact") },
    ];

    const userRoles: string[] = (session?.user as any)?.roles || [(session?.user as any)?.role || 'member'];
    const ADMIN_PANEL_ROLES = ['admin', 'president', 'vice_president', 'secretary', 'treasurer', 'media', 'editor', 'designer', 'developer', 'coordinator'];
    const isAdmin = userRoles.some(r => ADMIN_PANEL_ROLES.includes(r));

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className={`sticky top-0 z-50 w-full transition-all duration-500 ${
                scrolled
                    ? "backdrop-blur-2xl bg-nicer-dark/70 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
                    : "backdrop-blur-md bg-transparent border-b border-white/5"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0"
                    >
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-nicer-blue-dark to-nicer-blue-light flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(0,168,232,0.5)] transition-shadow duration-300">
                                <span className="text-sm font-black text-white">NC</span>
                            </div>
                            <span className="text-xl font-black text-white hidden sm:block">NICER Club</span>
                        </Link>
                    </motion.div>

                    {/* Nav Links (Desktop) */}
                    <div className="hidden md:block">
                        <div className="flex items-baseline gap-1">
                            {navLinks.map((link, i) => {
                                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                                return (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.05 }}
                                    >
                                        <Link
                                            href={link.href as any}
                                            className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                                isActive
                                                    ? "text-nicer-blue-light"
                                                    : "text-slate-300 hover:text-white"
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeNavBg"
                                                    className="absolute inset-0 bg-nicer-blue/15 backdrop-blur-sm rounded-lg border border-nicer-blue/20"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10">{link.label}</span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {/* Language Switcher */}
                        <div className="flex gap-0.5 bg-white/[0.03] backdrop-blur-xl rounded-lg p-1 border border-white/5">
                            {["en", "ku", "ar"].map((lang) => (
                                <Link
                                    key={lang}
                                    href={pathname as any}
                                    locale={lang as any}
                                    className="text-xs px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                                >
                                    {lang.toUpperCase()}
                                </Link>
                            ))}
                        </div>

                        {/* Auth Section */}
                        {status === "loading" ? (
                            <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse"></div>
                        ) : session ? (
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06] transition-all font-medium"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-nicer-blue-dark to-nicer-blue-light flex items-center justify-center shadow-[0_0_10px_rgba(0,168,232,0.3)]">
                                        <span className="text-[10px] font-bold text-white uppercase">{session.user?.name?.charAt(0) || "U"}</span>
                                    </div>
                                    <span className="text-white text-sm hidden sm:block truncate max-w-[100px]">{session.user?.name}</span>
                                    <motion.span
                                        animate={{ rotate: menuOpen ? 180 : 0 }}
                                        className="text-slate-400 text-xs"
                                    >▼</motion.span>
                                </motion.button>

                                <AnimatePresence>
                                    {menuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-3 w-56 bg-nicer-dark/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden z-[100]"
                                        >
                                            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                                <p className="text-white text-sm font-semibold truncate">{session.user?.name}</p>
                                                <p className="text-slate-400 text-xs truncate mt-0.5">{session.user?.email}</p>
                                                <span className="text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full bg-nicer-blue/20 text-nicer-blue-light font-bold uppercase tracking-wider">
                                                    {userRoles.join(', ').replace(/_/g, ' ')}
                                                </span>
                                            </div>

                                            <div className="py-2 flex flex-col">
                                                {isAdmin && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-nicer-blue/10 hover:text-nicer-blue-light transition-colors"
                                                    >
                                                        <span>📊</span> {t("adminDashboard") || "Admin Dashboard"}
                                                    </Link>
                                                )}

                                                <Link
                                                    href="/profile"
                                                    onClick={() => setMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-nicer-blue/10 hover:text-nicer-blue-light transition-colors"
                                                >
                                                    <span>👤</span> {t("myProfile") || "My Profile"}
                                                </Link>
                                            </div>

                                            <div className="py-2 border-t border-white/5">
                                                <button
                                                    onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                                                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                >
                                                    <span>🚪</span> {t("signOut") || "Sign Out"}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href="/auth/login"
                                    className="inline-flex px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white text-xs sm:text-sm font-bold hover:shadow-[0_0_25px_rgba(0,168,232,0.5)] transition-all"
                                >
                                    {t("signIn") || "Sign In"}
                                </Link>
                            </motion.div>
                        )}

                        {/* Mobile Menu Button */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-white p-2"
                        >
                            <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden bg-nicer-dark/95 backdrop-blur-2xl border-t border-white/5 overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {navLinks.map((link, i) => {
                                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                                return (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={link.href as any}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                                isActive
                                                    ? "bg-nicer-blue/15 text-nicer-blue-light border border-nicer-blue/20"
                                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
