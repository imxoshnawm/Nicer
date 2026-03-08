"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import secureFetch from "@/lib/secureFetch";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

interface MemberResult {
    _id: string;
    name: string;
    memberId: string;
    avatar?: string;
    email: string;
}

interface TeamMember {
    user: MemberResult;
    role: string;
}

const T: Record<string, Record<string, string>> = {
    pageTitle: { en: "Submit a Project", ku: "ناردنی پڕۆژە", ar: "تقديم مشروع" },
    title: { en: "Project Title", ku: "ناونیشانی پڕۆژە", ar: "عنوان المشروع" },
    titlePh: { en: "Enter project title...", ku: "ناونیشانی پڕۆژە...", ar: "أدخل عنوان المشروع..." },
    description: { en: "Description", ku: "وەسف", ar: "الوصف" },
    descPh: { en: "Describe your project in detail...", ku: "پڕۆژەکەت بە وردی باسبکە...", ar: "وصف مشروعك بالتفصيل..." },
    images: { en: "Project Images (up to 10)", ku: "وێنەکانی پڕۆژە (هەتا 10)", ar: "صور المشروع (حتى 10)" },
    dragDrop: { en: "Drag & drop images or click to browse", ku: "وێنەکان ڕابکێشە یان کلیک بکە", ar: "اسحب وأفلت الصور أو انقر للتصفح" },
    team: { en: "Team Members", ku: "ئەندامانی تیم", ar: "أعضاء الفريق" },
    searchMembers: { en: "Search by name, email, or member ID...", ku: "گەڕان بە ناو، ئیمەیڵ، یان ناسنامە...", ar: "البحث بالاسم أو البريد أو رقم العضوية..." },
    role: { en: "Role in project", ku: "ڕۆڵ لە پڕۆژەدا", ar: "الدور في المشروع" },
    rolePh: { en: "e.g. Developer, Designer, Leader...", ku: "وەک: گەشەپێدەر، دیزاینەر...", ar: "مثل: مطور، مصمم، قائد..." },
    link: { en: "Project Link (optional)", ku: "لینکی پڕۆژە (دڵخوازانە)", ar: "رابط المشروع (اختياري)" },
    linkPh: { en: "https://...", ku: "https://...", ar: "https://..." },
    videoUrl: { en: "Video URL (YouTube or Google Drive, optional)", ku: "لینکی ڤیدیۆ (یوتوب یان گوگڵ درایڤ، دڵخوازانە)", ar: "رابط الفيديو (يوتيوب أو جوجل درايف، اختياري)" },
    videoPh: { en: "https://youtube.com/watch?v=... or Google Drive link", ku: "https://youtube.com/watch?v=... یان لینکی گوگڵ درایڤ", ar: "https://youtube.com/watch?v=... أو رابط جوجل درايف" },
    submit: { en: "Submit Project", ku: "ناردنی پڕۆژە", ar: "تقديم المشروع" },
    submitting: { en: "Submitting...", ku: "دەنێردرێت...", ar: "جاري التقديم..." },
    loginRequired: { en: "You must be logged in to submit a project.", ku: "دەبێت بچیتە ژوورەوە بۆ ناردنی پڕۆژە.", ar: "يجب تسجيل الدخول لتقديم مشروع." },
    back: { en: "← Back to Projects", ku: "← گەڕانەوە بۆ پڕۆژەکان", ar: "← العودة إلى المشاريع" },
    addMember: { en: "Add to team", ku: "زیادکردن بۆ تیم", ar: "أضف إلى الفريق" },
    noResults: { en: "No members found", ku: "هیچ ئەندامێک نەدۆزرایەوە", ar: "لم يتم العثور على أعضاء" },
    minOneMember: { en: "At least one team member is required", ku: "بەلایەنی کەم یەک ئەندامی تیم پێویستە", ar: "مطلوب عضو فريق واحد على الأقل" },
};

export default function NewProjectPage() {
    const locale = useLocale();
    const router = useRouter();
    const { data: session, status } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [link, setLink] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<MemberResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const t = (key: string) => T[key]?.[locale] || T[key]?.en || key;
    const inputClass = "w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all text-sm";

    // Auto-add current user as first team member
    useEffect(() => {
        if (session?.user && teamMembers.length === 0) {
            const u = session.user as any;
            setTeamMembers([{
                user: { _id: u.id || u._id || '', name: u.name || '', memberId: u.memberId || '', avatar: u.avatar || '', email: u.email || '' },
                role: 'Leader',
            }]);
        }
    }, [session]);

    // Search members
    useEffect(() => {
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/members/search?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter out already added members
                    const addedIds = new Set(teamMembers.map(m => m.user._id));
                    setSearchResults(data.members.filter((m: MemberResult) => !addedIds.has(m._id)));
                }
            } catch { }
            setSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, teamMembers]);

    // Image upload
    const uploadImages = async (files: FileList | File[]) => {
        const remaining = 10 - images.length;
        const toUpload = Array.from(files).slice(0, remaining);
        if (toUpload.length === 0) return;

        setUploading(true);
        setError("");
        for (const file of toUpload) {
            if (file.size > 5 * 1024 * 1024) { setError("Each image must be less than 5MB"); continue; }
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) continue;
            try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await secureFetch("/api/upload", { method: "POST", body: formData });
                if (res.ok) {
                    const data = await res.json();
                    setImages(prev => [...prev, data.url]);
                }
            } catch { }
        }
        setUploading(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) uploadImages(e.dataTransfer.files);
    }, [images.length]);

    const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

    const addTeamMember = (member: MemberResult) => {
        setTeamMembers(prev => [...prev, { user: member, role: '' }]);
        setSearchQuery("");
        setSearchResults([]);
        setShowSearch(false);
    };

    const removeTeamMember = (idx: number) => {
        setTeamMembers(prev => prev.filter((_, i) => i !== idx));
    };

    const updateMemberRole = (idx: number, role: string) => {
        setTeamMembers(prev => prev.map((m, i) => i === idx ? { ...m, role } : m));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (teamMembers.length === 0) { setError(t("minOneMember")); return; }
        if (teamMembers.some(m => !m.role.trim())) { setError(locale === 'ku' ? 'ڕۆڵی هەموو ئەندامانی تیم پڕبکەرەوە' : 'Please fill in roles for all team members'); return; }

        setSaving(true);
        setError("");
        try {
            const body = {
                title,
                description,
                images,
                members: teamMembers.map(m => ({ user: m.user._id, role: m.role })),
                link: link || undefined,
                videoUrl: videoUrl || undefined,
            };
            const res = await secureFetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                router.push(`/${locale}/projects`);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to submit project");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-nicer-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-nicer-dark flex items-center justify-center text-white">
                <div className="text-center">
                    <span className="text-6xl block mb-4">🔒</span>
                    <p className="text-slate-400 mb-4">{t("loginRequired")}</p>
                    <a href={`/${locale}/auth/login`} className="text-purple-400 hover:underline">Sign In →</a>
                </div>
            </div>
        );
    }

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="about" />

            <div className="max-w-3xl mx-auto px-6 pt-8 relative z-10">
                <FadeInUp>
                    <a href={`/${locale}/projects`} className="text-slate-400 hover:text-white text-sm transition-colors">{t("back")}</a>
                </FadeInUp>
            </div>

            <header className="max-w-3xl mx-auto px-6 py-8 relative z-10">
                <FadeInDown>
                    <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                        🚀 {t("pageTitle")}
                    </h1>
                </FadeInDown>
            </header>

            <main className="max-w-3xl mx-auto px-6 relative z-10">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>
                )}

                <FadeInUp>
                    <form onSubmit={handleSubmit} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6"
                        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("title")} <span className="text-red-400">*</span></label>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("titlePh")}
                                className={inputClass} required minLength={3} maxLength={200}
                                dir={locale !== 'en' ? 'rtl' : 'ltr'} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("description")} <span className="text-red-400">*</span></label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("descPh")}
                                rows={5} className={inputClass + " resize-none"} required minLength={10} maxLength={5000}
                                dir={locale !== 'en' ? 'rtl' : 'ltr'} />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("images")}</label>

                            {/* Existing images */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {images.length < 10 && (
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                        dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
                                    }`}
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
                                            <p className="text-slate-400 text-sm">Uploading...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-3xl block mb-2">🖼️</span>
                                            <p className="text-slate-400 text-sm">{t("dragDrop")}</p>
                                            <p className="text-slate-600 text-xs mt-1">JPG, PNG, WebP, GIF · Max 5MB each · {images.length}/10</p>
                                        </>
                                    )}
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple
                                className="hidden" onChange={e => e.target.files && uploadImages(e.target.files)} />
                        </div>

                        {/* Team Members */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("team")} <span className="text-red-400">*</span></label>

                            {/* Current team */}
                            <div className="space-y-2 mb-3">
                                {teamMembers.map((tm, i) => (
                                    <div key={tm.user._id} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                                        {tm.user.avatar ? (
                                            <img src={tm.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                                                <span className="text-xs font-bold">{tm.user.name.charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{tm.user.name}</p>
                                            <p className="text-slate-500 text-[10px]">{tm.user.memberId || tm.user.email}</p>
                                        </div>
                                        <input
                                            value={tm.role}
                                            onChange={e => updateMemberRole(i, e.target.value)}
                                            placeholder={t("rolePh")}
                                            className="w-36 sm:w-44 px-2 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                                        />
                                        {i > 0 && (
                                            <button type="button" onClick={() => removeTeamMember(i)}
                                                className="text-red-400 hover:text-red-300 text-sm">✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Search for members */}
                            <div className="relative">
                                <input
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                                    onFocus={() => setShowSearch(true)}
                                    placeholder={t("searchMembers")}
                                    className={inputClass}
                                />
                                {showSearch && searchQuery.length >= 2 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-nicer-dark/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-20 max-h-60 overflow-y-auto shadow-2xl">
                                        {searching ? (
                                            <div className="p-4 text-center text-slate-400 text-sm">Searching...</div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500 text-sm">{t("noResults")}</div>
                                        ) : (
                                            searchResults.map(member => (
                                                <button
                                                    key={member._id}
                                                    type="button"
                                                    onClick={() => addTeamMember(member)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition-colors text-left"
                                                >
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                                                            <span className="text-xs font-bold">{member.name.charAt(0)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{member.name}</p>
                                                        <p className="text-slate-500 text-xs truncate">{member.memberId} · {member.email}</p>
                                                    </div>
                                                    <span className="text-purple-400 text-xs font-medium">{t("addMember")}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Click outside to close */}
                            {showSearch && <div className="fixed inset-0 z-10" onClick={() => setShowSearch(false)} />}
                        </div>

                        {/* Project Link */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("link")}</label>
                            <input value={link} onChange={e => setLink(e.target.value)} placeholder={t("linkPh")}
                                className={inputClass} type="url" />
                        </div>

                        {/* Video URL */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("videoUrl")}</label>
                            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder={t("videoPh")}
                                className={inputClass} />
                            <p className="text-slate-600 text-[10px] mt-1">YouTube or Google Drive links only</p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.01] transition-all disabled:opacity-50 text-sm"
                        >
                            {saving ? t("submitting") : `🚀 ${t("submit")}`}
                        </button>
                    </form>
                </FadeInUp>
            </main>
        </div>
    );
}
