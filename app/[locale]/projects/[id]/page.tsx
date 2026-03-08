"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import secureFetch from "@/lib/secureFetch";
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

interface MemberResult {
    _id: string;
    name: string;
    memberId?: string;
    avatar?: string;
    email?: string;
}

interface EditTeamMember {
    user: MemberResult;
    role: string;
}

interface ProjectMember {
    user: { _id: string; name: string; memberId?: string; avatar?: string; bio?: string; roles?: string[] };
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
    createdBy: { _id: string; name: string; email?: string; memberId?: string; avatar?: string };
    status: string;
    createdAt: string;
    updatedAt?: string;
}

const T: Record<string, Record<string, string>> = {
    back: { en: "← Back to Projects", ku: "← گەڕانەوە بۆ پڕۆژەکان", ar: "← العودة إلى المشاريع" },
    team: { en: "Team Members", ku: "ئەندامانی تیم", ar: "أعضاء الفريق" },
    visitLink: { en: "Visit Project", ku: "سەردانی پڕۆژە", ar: "زيارة المشروع" },
    watchVideo: { en: "Watch Video", ku: "بینینی ڤیدیۆ", ar: "مشاهدة الفيديو" },
    by: { en: "Published by", ku: "بڵاوکراوەتەوە لەلایەن", ar: "نُشر بواسطة" },
    notFound: { en: "Project not found", ku: "پڕۆژە نەدۆزرایەوە", ar: "المشروع غير موجود" },
    edit: { en: "Edit Project", ku: "دەستکاری پڕۆژە", ar: "تعديل المشروع" },
    editing: { en: "Editing...", ku: "دەستکاری...", ar: "جاري التعديل..." },
    save: { en: "Save Changes", ku: "پاشەکەوتکردن", ar: "حفظ التغييرات" },
    saving: { en: "Saving...", ku: "پاشەکەوت دەکرێت...", ar: "جاري الحفظ..." },
    cancel: { en: "Cancel", ku: "پاشگەزبوونەوە", ar: "إلغاء" },
    title: { en: "Title", ku: "ناونیشان", ar: "العنوان" },
    description: { en: "Description", ku: "وەسف", ar: "الوصف" },
    projectLink: { en: "Project Link", ku: "لینکی پڕۆژە", ar: "رابط المشروع" },
    videoUrl: { en: "Video URL", ku: "لینکی ڤیدیۆ", ar: "رابط الفيديو" },
    teamMembers: { en: "Team Members", ku: "ئەندامانی تیم", ar: "أعضاء الفريق" },
    searchMembers: { en: "Search by name, email, or ID...", ku: "گەڕان بە ناو، ئیمەیڵ، یان ناسنامە...", ar: "البحث بالاسم أو البريد أو الرقم..." },
    rolePh: { en: "e.g. Developer, Designer...", ku: "وەک: گەشەپێدەر، دیزاینەر...", ar: "مثل: مطور، مصمم..." },
    addMember: { en: "Add", ku: "زیادکردن", ar: "إضافة" },
    noResults: { en: "No members found", ku: "هیچ ئەندامێک نەدۆزرایەوە", ar: "لم يتم العثور على أعضاء" },
    deleteProject: { en: "Delete Project", ku: "سڕینەوەی پڕۆژە", ar: "حذف المشروع" },
    confirmDelete: { en: "Are you sure? This cannot be undone.", ku: "دڵنیایت؟ ناکرێت گەڕێنرێتەوە.", ar: "هل أنت متأكد؟ لا يمكن التراجع." },
};

function getEmbedUrl(url: string): string | null {
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    return null;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const locale = useLocale();
    const router = useRouter();
    const { data: session } = useSession();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [currentImg, setCurrentImg] = useState(0);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editLink, setEditLink] = useState("");
    const [editVideoUrl, setEditVideoUrl] = useState("");
    const [editMembers, setEditMembers] = useState<EditTeamMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<MemberResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const t = (key: string) => T[key]?.[locale] || T[key]?.en || key;

    // Is the current user the project owner or admin?
    const userId = (session?.user as any)?.id || (session?.user as any)?._id;
    const userRoles: string[] = (session?.user as any)?.roles || [];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('president');
    const isOwner = project?.createdBy?._id === userId;
    const canEdit = isOwner || isAdmin;

    useEffect(() => {
        fetch(`/api/projects/${id}`)
            .then(r => {
                if (!r.ok) throw new Error("Not found");
                return r.json();
            })
            .then(data => setProject(data))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    const startEditing = () => {
        if (!project) return;
        setEditTitle(project.title);
        setEditDesc(project.description);
        setEditLink(project.link || "");
        setEditVideoUrl(project.videoUrl || "");
        setEditMembers(project.members.map(m => ({
            user: { _id: m.user._id, name: m.user.name, memberId: m.user.memberId, avatar: m.user.avatar },
            role: m.role,
        })));
        setSearchQuery("");
        setSearchResults([]);
        setEditing(true);
        setError("");
    };

    // Search members for editing
    useEffect(() => {
        if (!editing || searchQuery.length < 2) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/members/search?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    const addedIds = new Set(editMembers.map(m => m.user._id));
                    setSearchResults((data.members || []).filter((m: MemberResult) => !addedIds.has(m._id)));
                }
            } catch { }
            setSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, editMembers, editing]);

    const addTeamMember = (member: MemberResult) => {
        setEditMembers(prev => [...prev, { user: member, role: '' }]);
        setSearchQuery("");
        setSearchResults([]);
        setShowSearch(false);
    };

    const removeTeamMember = (idx: number) => {
        setEditMembers(prev => prev.filter((_, i) => i !== idx));
    };

    const updateMemberRole = (idx: number, role: string) => {
        setEditMembers(prev => prev.map((m, i) => i === idx ? { ...m, role } : m));
    };

    const handleSave = async () => {
        if (!project) return;
        setSaving(true);
        setError("");
        try {
            if (editMembers.length === 0) {
                setError("At least one team member is required");
                setSaving(false);
                return;
            }
            if (editMembers.some(m => !m.role.trim())) {
                setError(locale === 'ku' ? 'ڕۆڵی هەموو ئەندامانی تیم پڕبکەرەوە' : 'Please fill in roles for all team members');
                setSaving(false);
                return;
            }
            const res = await secureFetch(`/api/projects/${project._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDesc,
                    link: editLink || undefined,
                    videoUrl: editVideoUrl || undefined,
                    members: editMembers.map(m => ({ user: m.user._id, role: m.role })),
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setProject(updated);
                setEditing(false);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to update");
            }
        } catch {
            setError("Something went wrong");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!project) return;
        try {
            const res = await secureFetch(`/api/projects/${project._id}`, { method: "DELETE" });
            if (res.ok) {
                router.push(`/${locale}/projects`);
            }
        } catch { }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-nicer-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    if (notFound || !project) {
        return (
            <div className="min-h-screen bg-nicer-dark flex items-center justify-center text-white">
                <div className="text-center">
                    <span className="text-6xl block mb-4">📂</span>
                    <h1 className="text-2xl font-bold mb-2">{t("notFound")}</h1>
                    <Link href={`/${locale}/projects`} className="text-purple-400 hover:underline text-sm">{t("back")}</Link>
                </div>
            </div>
        );
    }

    const embedUrl = project.videoUrl ? getEmbedUrl(project.videoUrl) : null;

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="about" />

            {/* Back button + Edit */}
            <div className="max-w-5xl mx-auto px-6 pt-8 relative z-10 flex items-center justify-between">
                <FadeInUp>
                    <Link href={`/${locale}/projects`} className="text-slate-400 hover:text-white text-sm transition-colors">
                        {t("back")}
                    </Link>
                </FadeInUp>
                {canEdit && !editing && (
                    <FadeInUp>
                        <button onClick={startEditing}
                            className="px-4 py-2 bg-purple-500/15 text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-500/25 transition-colors">
                            ✏️ {t("edit")}
                        </button>
                    </FadeInUp>
                )}
            </div>

            {/* Image Gallery */}
            {project.images.length > 0 && (
                <div className="max-w-5xl mx-auto px-6 mt-6 relative z-10">
                    <FadeInDown>
                        <div className="relative rounded-2xl overflow-hidden bg-black/30 border border-white/10">
                            <div className="aspect-video relative">
                                <img src={project.images[currentImg]} alt={project.title}
                                    className="w-full h-full object-contain bg-black/50" />

                                {project.images.length > 1 && (
                                    <>
                                        <button onClick={() => setCurrentImg((currentImg - 1 + project.images.length) % project.images.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">←</button>
                                        <button onClick={() => setCurrentImg((currentImg + 1) % project.images.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">→</button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {project.images.length > 1 && (
                                <div className="flex gap-2 p-3 overflow-x-auto bg-black/30">
                                    {project.images.map((img, i) => (
                                        <button key={i} onClick={() => setCurrentImg(i)}
                                            className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                                                i === currentImg ? 'border-purple-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FadeInDown>
                </div>
            )}

            {/* Content */}
            <main className="max-w-5xl mx-auto px-6 mt-8 relative z-10">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <FadeInUp>
                            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}>

                                {editing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("title")}</label>
                                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("description")}</label>
                                            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={10}
                                                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("projectLink")}</label>
                                            <input value={editLink} onChange={e => setEditLink(e.target.value)} type="url"
                                                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                                placeholder="https://..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("videoUrl")}</label>
                                            <input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                                placeholder="YouTube or Google Drive URL" />
                                        </div>

                                        {/* Team Members Edit */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">👥 {t("teamMembers")}</label>

                                            {/* Current team list */}
                                            <div className="space-y-2 mb-3">
                                                {editMembers.map((tm, i) => (
                                                    <div key={tm.user._id + i} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                                                        {tm.user.avatar ? (
                                                            <img src={tm.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                                                                <span className="text-xs font-bold">{tm.user.name.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-medium truncate">{tm.user.name}</p>
                                                            <p className="text-slate-500 text-[10px]">{tm.user.memberId || ''}</p>
                                                        </div>
                                                        <input
                                                            value={tm.role}
                                                            onChange={e => updateMemberRole(i, e.target.value)}
                                                            placeholder={t("rolePh")}
                                                            className="w-28 sm:w-36 px-2 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                                                        />
                                                        <button type="button" onClick={() => removeTeamMember(i)}
                                                            className="text-red-400 hover:text-red-300 text-sm flex-shrink-0">✕</button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Search to add members */}
                                            <div className="relative">
                                                <input
                                                    value={searchQuery}
                                                    onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                                                    onFocus={() => setShowSearch(true)}
                                                    placeholder={t("searchMembers")}
                                                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 placeholder-slate-500"
                                                />
                                                {showSearch && searchQuery.length >= 2 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-nicer-dark/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto shadow-2xl">
                                                        {searching ? (
                                                            <div className="p-3 text-center text-slate-400 text-sm">Searching...</div>
                                                        ) : searchResults.length === 0 ? (
                                                            <div className="p-3 text-center text-slate-500 text-sm">{t("noResults")}</div>
                                                        ) : (
                                                            searchResults.map(member => (
                                                                <button
                                                                    key={member._id}
                                                                    type="button"
                                                                    onClick={() => addTeamMember(member)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
                                                                >
                                                                    {member.avatar ? (
                                                                        <img src={member.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                                                                            <span className="text-[10px] font-bold">{member.name.charAt(0)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-white text-sm font-medium truncate">{member.name}</p>
                                                                        <p className="text-slate-500 text-[10px] truncate">{member.memberId}{member.email ? ` · ${member.email}` : ''}</p>
                                                                    </div>
                                                                    <span className="text-purple-400 text-xs font-medium">+ {t("addMember")}</span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {showSearch && <div className="fixed inset-0 z-10" onClick={() => setShowSearch(false)} />}
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setEditing(false)}
                                                className="flex-1 py-2.5 bg-white/[0.04] border border-white/10 text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all">
                                                {t("cancel")}
                                            </button>
                                            <button onClick={handleSave} disabled={saving}
                                                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50">
                                                {saving ? t("saving") : `💾 ${t("save")}`}
                                            </button>
                                        </div>

                                        {/* Delete button */}
                                        <div className="pt-4 border-t border-white/5">
                                            {deleteConfirm ? (
                                                <div className="flex gap-3 items-center">
                                                    <p className="text-red-400 text-xs flex-1">{t("confirmDelete")}</p>
                                                    <button onClick={handleDelete}
                                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/30">Yes, Delete</button>
                                                    <button onClick={() => setDeleteConfirm(false)}
                                                        className="px-4 py-2 bg-white/[0.04] text-slate-400 rounded-xl text-xs hover:bg-white/[0.06]">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(true)}
                                                    className="text-red-400/60 text-xs hover:text-red-400 transition-colors">
                                                    🗑 {t("deleteProject")}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">{project.title}</h1>
                                        <p className="text-slate-500 text-sm mb-6">
                                            {t("by")} {project.createdBy.name} · {new Date(project.createdAt).toLocaleDateString()}
                                        </p>
                                        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {project.description}
                                        </div>

                                        {/* Links */}
                                        <div className="flex flex-wrap gap-3 mt-6">
                                            {project.link && (
                                                <a href={project.link} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/15 text-purple-300 text-sm font-medium hover:bg-purple-500/25 transition-colors">
                                                    🔗 {t("visitLink")}
                                                </a>
                                            )}
                                            {project.videoUrl && (
                                                <a href={project.videoUrl} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 text-red-300 text-sm font-medium hover:bg-red-500/25 transition-colors">
                                                    ▶️ {t("watchVideo")}
                                                </a>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </FadeInUp>

                        {/* Video Embed */}
                        {embedUrl && !editing && (
                            <FadeInUp delay={0.2}>
                                <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                                    <div className="aspect-video">
                                        <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                                    </div>
                                </div>
                            </FadeInUp>
                        )}
                    </div>

                    {/* Sidebar - Team */}
                    <div>
                        <FadeInRight>
                            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    👥 {t("team")}
                                </h3>

                                <div className="space-y-3">
                                    {project.members.map((pm, i) => (
                                        <Link key={i} href={`/${locale}/members/${pm.user._id}`}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-all group">
                                            {pm.user.avatar ? (
                                                <img src={pm.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                                                    <span className="text-sm font-bold">{pm.user.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium group-hover:text-purple-300 transition-colors truncate">{pm.user.name}</p>
                                                {pm.user.memberId && (
                                                    <p className="text-slate-600 text-[10px] font-mono">{pm.user.memberId}</p>
                                                )}
                                            </div>
                                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-[10px] font-bold">
                                                {pm.role}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </FadeInRight>
                    </div>
                </div>
            </main>
        </div>
    );
}
