"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    StaggerContainer,
    StaggerItem,
    ScaleIn,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

const ROLE_KEYS = ['admin', 'president', 'vice_president', 'secretary', 'treasurer', 'media', 'editor', 'designer', 'developer', 'coordinator', 'member'] as const;

const ROLE_COLORS: Record<string, string> = {
    admin: 'from-red-500 to-red-600', president: 'from-yellow-500 to-amber-600',
    vice_president: 'from-amber-500 to-amber-600', secretary: 'from-indigo-500 to-indigo-600',
    treasurer: 'from-emerald-500 to-emerald-600', media: 'from-pink-500 to-pink-600',
    editor: 'from-blue-500 to-blue-600', designer: 'from-purple-500 to-purple-600',
    developer: 'from-cyan-500 to-cyan-600', coordinator: 'from-orange-500 to-orange-600',
    member: 'from-green-500 to-green-600',
};

interface Member {
    _id: string;
    name: string;
    memberId: string;
    avatar?: string;
    bio?: string;
    roles: string[];
    department?: string;
}

export default function MembersPage() {
    const locale = useLocale();
    const t = useTranslations("MembersPage");
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        fetch("/api/members")
            .then(r => r.json())
            .then(data => setMembers(data.members || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = members.filter(m => {
        const matchSearch = !search ||
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.memberId?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" ||
            m.roles.includes(roleFilter);
        return matchSearch && matchRole;
    });

    // Separate role holders and regular members
    const roleHolders = filtered.filter(m => m.roles.some(r => r !== 'member'));
    const regularMembers = filtered.filter(m => m.roles.every(r => r === 'member'));

    const uniqueRoles = Array.from(new Set(members.flatMap(m => m.roles)));

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="activities" />

            {/* Header */}
            <header className="py-16 sm:py-24 px-4 sm:px-6 text-center relative overflow-hidden">
                <FadeInDown>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight relative z-10">
                        👥 {t("title")}
                    </h1>
                </FadeInDown>
                <FadeInUp delay={0.2}>
                    <p className="text-xl text-slate-400 mt-4 max-w-2xl mx-auto relative z-10">
                        {t("subtitle")}
                    </p>
                </FadeInUp>
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-px w-full max-w-sm mx-auto bg-gradient-to-r from-transparent via-nicer-blue to-transparent mt-8 opacity-50"
                />
            </header>

            <main className="max-w-6xl mx-auto px-6 relative z-10">
                {/* Search & Filter */}
                <FadeInUp delay={0.3}>
                    <div className="flex flex-col sm:flex-row gap-3 mb-10">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t("searchPlaceholder")}
                                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-nicer-blue text-sm"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setRoleFilter("all")}
                                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${roleFilter === 'all' ? 'bg-nicer-blue/20 text-nicer-blue-light border border-nicer-blue/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'}`}>
                                {t("all")} ({members.length})
                            </button>
                            {uniqueRoles.map(role => (
                                <button key={role} onClick={() => setRoleFilter(role)}
                                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${roleFilter === role ? 'bg-nicer-blue/20 text-nicer-blue-light border border-nicer-blue/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'}`}>
                                    {t.has(`roles.${role}`) ? t(`roles.${role}`) : role}
                                </button>
                            ))}
                        </div>
                    </div>
                </FadeInUp>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-nicer-blue"></div>
                    </div>
                ) : (
                    <>
                        {/* Role Holders Section */}
                        {roleHolders.length > 0 && (
                            <div className="mb-16">
                                <FadeInUp>
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-nicer-blue-dark to-nicer-blue flex items-center justify-center text-lg">⭐</span>
                                        {t("leadershipTeam")}
                                    </h2>
                                </FadeInUp>
                                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {roleHolders.map(member => (
                                        <StaggerItem key={member._id}>
                                            <MemberCard member={member} locale={locale} />
                                        </StaggerItem>
                                    ))}
                                </StaggerContainer>
                            </div>
                        )}

                        {/* Regular Members */}
                        {regularMembers.length > 0 && (
                            <div>
                                <FadeInUp>
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-green-500 flex items-center justify-center text-lg">👥</span>
                                        {t("members")}
                                    </h2>
                                </FadeInUp>
                                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {regularMembers.map(member => (
                                        <StaggerItem key={member._id}>
                                            <MemberCard member={member} locale={locale} />
                                        </StaggerItem>
                                    ))}
                                </StaggerContainer>
                            </div>
                        )}

                        {filtered.length === 0 && (
                            <ScaleIn>
                                <div className="text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10">
                                    <span className="text-6xl block mb-4">👥</span>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {t("noMembers")}
                                    </h3>
                                </div>
                            </ScaleIn>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function MemberCard({ member, locale }: { member: Member; locale: string }) {
    const t = useTranslations("MembersPage");
    const primaryRole = member.roles.find(r => r !== 'member') || 'member';
    const roleColor = ROLE_COLORS[primaryRole] || ROLE_COLORS.member;

    return (
        <Link href={`/${locale}/members/${member._id}`}>
            <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-nicer-blue/30 transition-all duration-300 cursor-pointer group"
                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
            >
                <div className="flex items-center gap-4 mb-3">
                    {/* Avatar */}
                    {member.avatar ? (
                        <img src={member.avatar} alt={member.name}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-white/10 group-hover:border-nicer-blue/30 transition-colors" />
                    ) : (
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-tr ${roleColor} flex items-center justify-center border-2 border-white/10 group-hover:border-white/20 transition-colors`}>
                            <span className="text-xl font-bold text-white">{member.name.charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm group-hover:text-nicer-blue-light transition-colors truncate">
                            {member.name}
                        </h3>
                        {member.memberId && (
                            <p className="text-slate-500 text-xs font-mono">{member.memberId}</p>
                        )}
                    </div>
                </div>

                {/* Roles */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {member.roles.map(role => (
                        <span key={role}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-gradient-to-r ${ROLE_COLORS[role] || ROLE_COLORS.member} text-white`}>
                            {t.has(`roles.${role}`) ? t(`roles.${role}`) : role}
                        </span>
                    ))}
                </div>

                {/* Bio */}
                {member.bio && (
                    <p className="text-slate-400 text-xs line-clamp-2 mt-2">{member.bio}</p>
                )}

                {member.department && (
                    <p className="text-slate-500 text-[11px] mt-2">🏫 {member.department}</p>
                )}
            </motion.div>
        </Link>
    );
}
