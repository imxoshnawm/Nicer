"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
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

const T: Record<string, Record<string, string>> = {
    title: { en: "Projects", ku: "پڕۆژەکان", ar: "المشاريع" },
    subtitle: { en: "Student projects and innovations by NICER Club members", ku: "پڕۆژەکانی خوێندکاران و داهێنانەکانی ئەندامانی کلوبی نایسەر", ar: "مشاريع وابتكارات الطلاب من أعضاء نادي نايسر" },
    search: { en: "Search projects...", ku: "گەڕان بۆ پڕۆژە...", ar: "البحث عن مشاريع..." },
    noProjects: { en: "No projects found", ku: "هیچ پڕۆژەیەک نەدۆزرایەوە", ar: "لا توجد مشاريع" },
    beFirst: { en: "Be the first to submit a project!", ku: "یەکەمین کەس بە بۆ ناردنی پڕۆژە!", ar: "كن أول من يقدم مشروعًا!" },
    submitProject: { en: "Submit a Project", ku: "ناردنی پڕۆژە", ar: "تقديم مشروع" },
    visitLink: { en: "Visit Project", ku: "سەردانی پڕۆژە", ar: "زيارة المشروع" },
    watchVideo: { en: "Watch Video", ku: "بینینی ڤیدیۆ", ar: "مشاهدة الفيديو" },
    members: { en: "Team", ku: "تیم", ar: "الفريق" },
    by: { en: "by", ku: "لەلایەن", ar: "بواسطة" },
};

export default function ProjectsPage() {
    const locale = useLocale();
    const { data: session } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [imageIndices, setImageIndices] = useState<Record<string, number>>({});

    const t = (key: string) => T[key]?.[locale] || T[key]?.en || key;

    useEffect(() => {
        fetch("/api/projects")
            .then(r => r.json())
            .then(data => setProjects(data.projects || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.members.some(m => m.user.name.toLowerCase().includes(search.toLowerCase()))
    );

    const nextImage = (projectId: string, total: number) => {
        setImageIndices(prev => ({ ...prev, [projectId]: ((prev[projectId] || 0) + 1) % total }));
    };
    const prevImage = (projectId: string, total: number) => {
        setImageIndices(prev => ({ ...prev, [projectId]: ((prev[projectId] || 0) - 1 + total) % total }));
    };

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="about" />

            {/* Header */}
            <header className="relative z-10 py-16 text-center">
                <FadeInDown>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur mb-6">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                        <span className="text-xs text-slate-300 font-medium">🚀 {t("title")}</span>
                    </div>
                </FadeInDown>
                <FadeInUp>
                    <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                        {t("title")}
                    </h1>
                    <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm sm:text-base px-6">{t("subtitle")}</p>
                </FadeInUp>
            </header>

            {/* Controls */}
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <FadeInUp>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-10">
                        <div className="relative flex-1 w-full sm:max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder={t("search")}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur border border-white/10 text-white text-sm placeholder-slate-500 outline-none focus:border-purple-500/40"
                            />
                        </div>
                        {session && (
                            <Link href={`/${locale}/projects/new`}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                                + {t("submitProject")}
                            </Link>
                        )}
                    </div>
                </FadeInUp>
            </div>

            {/* Projects Grid */}
            <main className="max-w-6xl mx-auto px-6 relative z-10">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <ScaleIn>
                        <div className="text-center py-20 bg-white/[0.03] rounded-3xl border border-white/10">
                            <span className="text-5xl block mb-4">📂</span>
                            <p className="text-slate-400 mb-2">{t("noProjects")}</p>
                            <p className="text-slate-500 text-sm">{t("beFirst")}</p>
                        </div>
                    </ScaleIn>
                ) : (
                    <StaggerContainer className="space-y-8">
                        {filtered.map(project => {
                            const currentImg = imageIndices[project._id] || 0;

                            return (
                                <StaggerItem key={project._id}>
                                    <div id={project._id}>
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/20 transition-all duration-300"
                                        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                    >
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Images */}
                                            {project.images.length > 0 && (
                                                <div className="lg:w-2/5 relative group">
                                                    <div className="aspect-video lg:aspect-auto lg:h-full relative overflow-hidden">
                                                        <img src={project.images[currentImg]} alt={project.title}
                                                            className="w-full h-full object-cover" />

                                                        {project.images.length > 1 && (
                                                            <>
                                                                <button onClick={() => prevImage(project._id, project.images.length)}
                                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm">←</button>
                                                                <button onClick={() => nextImage(project._id, project.images.length)}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</button>
                                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                                    {project.images.map((_, i) => (
                                                                        <button key={i} onClick={() => setImageIndices(prev => ({ ...prev, [project._id]: i }))}
                                                                            className={`w-2 h-2 rounded-full ${i === currentImg ? 'bg-white' : 'bg-white/40'} transition-all`} />
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="flex-1 p-6 sm:p-8">
                                                <Link href={`/${locale}/projects/${project._id}`}>
                                                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 hover:text-purple-300 transition-colors cursor-pointer">{project.title}</h3>
                                                </Link>
                                                <p className="text-slate-500 text-xs mb-4">
                                                    {t("by")} {project.createdBy.name} • {new Date(project.createdAt).toLocaleDateString()}
                                                </p>

                                                <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                                                    {project.description}
                                                </p>
                                                <Link href={`/${locale}/projects/${project._id}`}
                                                    className="text-purple-400 text-xs mt-1 hover:underline inline-block">
                                                    {locale === 'ku' ? 'بینینی زیاتر →' : locale === 'ar' ? 'عرض المزيد →' : 'View Details →'}
                                                </Link>

                                                {/* Team */}
                                                <div className="mt-5">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t("members")}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.members.map((pm, i) => (
                                                            <Link key={i} href={`/${locale}/members/${pm.user._id}`}
                                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 hover:border-purple-500/30 transition-colors">
                                                                {pm.user.avatar ? (
                                                                    <img src={pm.user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                                                                        <span className="text-[10px] font-bold">{pm.user.name.charAt(0)}</span>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <span className="text-white text-xs font-medium">{pm.user.name}</span>
                                                                    <span className="text-purple-400 text-[10px] ml-1.5">{pm.role}</span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Links */}
                                                <div className="flex flex-wrap gap-3 mt-5">
                                                    {project.link && (
                                                        <a href={project.link} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-medium hover:bg-purple-500/25 transition-colors">
                                                            🔗 {t("visitLink")}
                                                        </a>
                                                    )}
                                                    {project.videoUrl && (
                                                        <a href={project.videoUrl} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/15 text-red-300 text-xs font-medium hover:bg-red-500/25 transition-colors">
                                                            ▶️ {t("watchVideo")}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    </div>
                                </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                )}
            </main>
        </div>
    );
}
