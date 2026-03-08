"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    ScaleIn,
    StaggerContainer,
    StaggerItem,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin', president: 'President', vice_president: 'Vice President',
    secretary: 'Secretary', treasurer: 'Treasurer', media: 'Media',
    editor: 'Editor', designer: 'Designer', developer: 'Developer',
    coordinator: 'Coordinator', member: 'Member',
};

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
    email: string;
    memberId: string;
    avatar?: string;
    bio?: string;
    roles: string[];
    department?: string;
    createdAt: string;
}

interface ProjectMember {
    user: { _id: string; name: string; memberId?: string; avatar?: string };
    role: string;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    images: string[];
    members: ProjectMember[];
    link?: string;
    videoUrl?: string;
    createdBy: { _id: string; name: string };
    createdAt: string;
}

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const locale = useLocale();
    const [member, setMember] = useState<Member | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/members/${id}`)
            .then(r => {
                if (!r.ok) throw new Error('Not found');
                return r.json();
            })
            .then(data => {
                setMember(data.member);
                setProjects(data.projects || []);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-nicer-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-nicer-blue"></div>
            </div>
        );
    }

    if (notFound || !member) {
        return (
            <div className="min-h-screen bg-nicer-dark flex items-center justify-center text-white">
                <div className="text-center">
                    <span className="text-6xl block mb-4">😕</span>
                    <h1 className="text-2xl font-bold mb-2">Member not found</h1>
                    <Link href={`/${locale}/members`} className="text-nicer-blue-light hover:underline text-sm">
                        ← Back to Members
                    </Link>
                </div>
            </div>
        );
    }

    const primaryRole = member.roles.find(r => r !== 'member') || 'member';
    const roleColor = ROLE_COLORS[primaryRole] || ROLE_COLORS.member;

    // Find the member's role in each project
    const getMemberRole = (project: Project) => {
        const pm = project.members.find(m => m.user._id === member._id);
        return pm?.role || 'Member';
    };

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="about" />

            {/* Back button */}
            <div className="max-w-5xl mx-auto px-6 pt-8 relative z-10">
                <FadeInUp>
                    <Link href={`/${locale}/members`}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                        ← {locale === 'ku' ? 'گەڕانەوە بۆ ئەندامان' : locale === 'ar' ? 'العودة إلى الأعضاء' : 'Back to Members'}
                    </Link>
                </FadeInUp>
            </div>

            {/* Profile Header */}
            <header className="max-w-5xl mx-auto px-6 py-12 relative z-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10"
                    style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        <FadeInLeft>
                            {member.avatar ? (
                                <img src={member.avatar} alt={member.name}
                                    className="w-28 h-28 rounded-2xl object-cover border-4 border-white/10 shadow-xl" />
                            ) : (
                                <div className={`w-28 h-28 rounded-2xl bg-gradient-to-tr ${roleColor} flex items-center justify-center border-4 border-white/10 shadow-xl`}>
                                    <span className="text-4xl font-black text-white">{member.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                        </FadeInLeft>

                        <FadeInRight className="flex-1 text-center sm:text-left">
                            <h1 className="text-3xl sm:text-4xl font-black text-white">{member.name}</h1>

                            {member.memberId && (
                                <p className="text-nicer-blue-light font-mono text-sm mt-1">{member.memberId}</p>
                            )}

                            {/* Roles */}
                            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                                {member.roles.map(role => (
                                    <span key={role}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase bg-gradient-to-r ${ROLE_COLORS[role] || ROLE_COLORS.member} text-white`}>
                                        {ROLE_LABELS[role] || role}
                                    </span>
                                ))}
                            </div>

                            {/* Bio */}
                            {member.bio && (
                                <p className="text-slate-300 mt-4 text-sm leading-relaxed max-w-xl">{member.bio}</p>
                            )}

                            {/* Meta */}
                            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500 justify-center sm:justify-start">
                                {member.department && (
                                    <span className="flex items-center gap-1">🏫 {member.department}</span>
                                )}
                                <span className="flex items-center gap-1">
                                    📅 {locale === 'ku' ? 'بەشداری کرد لە' : locale === 'ar' ? 'انضم في' : 'Joined'} {new Date(member.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </FadeInRight>
                    </div>
                </div>
            </header>

            {/* Projects Section */}
            <main className="max-w-5xl mx-auto px-6 relative z-10">
                <FadeInUp>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-lg">🚀</span>
                        {locale === 'ku' ? 'پڕۆژەکان' : locale === 'ar' ? 'المشاريع' : 'Projects'} ({projects.length})
                    </h2>
                </FadeInUp>

                {projects.length === 0 ? (
                    <ScaleIn>
                        <div className="text-center py-16 bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10">
                            <span className="text-5xl block mb-3">📂</span>
                            <p className="text-slate-400">
                                {locale === 'ku' ? 'هیچ پڕۆژەیەک نەدۆزرایەوە' : locale === 'ar' ? 'لا توجد مشاريع بعد' : 'No projects yet'}
                            </p>
                        </div>
                    </ScaleIn>
                ) : (
                    <StaggerContainer className="space-y-6">
                        {projects.map(project => (
                            <StaggerItem key={project._id}>
                                <Link href={`/${locale}/projects#${project._id}`}>
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-nicer-blue/30 transition-all duration-300 group"
                                        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                    >
                                        {/* Image */}
                                        {project.images.length > 0 && (
                                            <div className="h-48 overflow-hidden">
                                                <img src={project.images[0]} alt={project.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            </div>
                                        )}

                                        <div className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white group-hover:text-nicer-blue-light transition-colors">
                                                        {project.title}
                                                    </h3>
                                                    <span className="text-nicer-blue text-xs font-medium mt-1 inline-block">
                                                        {locale === 'ku' ? 'ڕۆڵ' : locale === 'ar' ? 'الدور' : 'Role'}: {getMemberRole(project)}
                                                    </span>
                                                </div>
                                                <span className="text-slate-500 text-xs shrink-0">
                                                    {new Date(project.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mt-3 line-clamp-2">{project.description}</p>

                                            {/* Team */}
                                            <div className="flex items-center gap-2 mt-4">
                                                <div className="flex -space-x-2">
                                                    {project.members.slice(0, 5).map((pm, i) => (
                                                        pm.user.avatar ? (
                                                            <img key={i} src={pm.user.avatar} alt="" className="w-7 h-7 rounded-full border-2 border-nicer-dark object-cover" />
                                                        ) : (
                                                            <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-tr from-nicer-blue-dark to-nicer-blue flex items-center justify-center border-2 border-nicer-dark">
                                                                <span className="text-[10px] font-bold text-white">{pm.user.name.charAt(0)}</span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                                <span className="text-slate-500 text-xs">{project.members.length} {locale === 'ku' ? 'ئەندام' : locale === 'ar' ? 'عضو' : 'members'}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                )}
            </main>
        </div>
    );
}
