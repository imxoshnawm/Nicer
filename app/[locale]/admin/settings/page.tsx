"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Stat {
    value: string;
    label: string;
    labelKu: string;
    labelAr: string;
}

interface Category {
    name: string;
    nameKu: string;
    nameAr: string;
    icon: string;
    description: string;
    descriptionKu: string;
    descriptionAr: string;
    color: string;
}

const COLOR_OPTIONS = [
    { label: "Blue→Cyan", value: "from-blue-500 to-cyan-500" },
    { label: "Green→Emerald", value: "from-green-500 to-emerald-500" },
    { label: "Orange→Amber", value: "from-orange-500 to-amber-500" },
    { label: "Purple→Pink", value: "from-purple-500 to-pink-500" },
    { label: "Red→Rose", value: "from-red-500 to-rose-500" },
    { label: "Teal→Blue", value: "from-teal-500 to-blue-500" },
    { label: "Yellow→Orange", value: "from-yellow-500 to-orange-500" },
    { label: "Indigo→Violet", value: "from-indigo-500 to-violet-500" },
];

export default function AdminSettingsPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const roles = (session?.user as any)?.roles || [role];
    const isAdmin = role === "admin" || roles?.includes("admin");
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [stats, setStats] = useState<Stat[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [coverTitle, setCoverTitle] = useState("");
    const [coverTitleKu, setCoverTitleKu] = useState("");
    const [coverTitleAr, setCoverTitleAr] = useState("");
    const [coverSubtitle, setCoverSubtitle] = useState("");
    const [coverSubtitleKu, setCoverSubtitleKu] = useState("");
    const [coverSubtitleAr, setCoverSubtitleAr] = useState("");

    const [activeTab, setActiveTab] = useState<"stats" | "categories" | "cover">("stats");

    useEffect(() => {
        if (role && !isAdmin) router.push("/admin");
    }, [role, isAdmin, router]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await secureFetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || []);
                setCategories(data.categories || []);
                setCoverTitle(data.coverTitle || "");
                setCoverTitleKu(data.coverTitleKu || "");
                setCoverTitleAr(data.coverTitleAr || "");
                setCoverSubtitle(data.coverSubtitle || "");
                setCoverSubtitleKu(data.coverSubtitleKu || "");
                setCoverSubtitleAr(data.coverSubtitleAr || "");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            const res = await secureFetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stats, categories,
                    coverTitle, coverTitleKu, coverTitleAr,
                    coverSubtitle, coverSubtitleKu, coverSubtitleAr,
                }),
            });
            if (res.ok) {
                setMessage("Settings saved successfully!");
                setTimeout(() => setMessage(""), 3000);
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error}`);
            }
        } catch {
            setMessage("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // Stat helpers
    const addStat = () => setStats([...stats, { value: "", label: "", labelKu: "", labelAr: "" }]);
    const removeStat = (i: number) => setStats(stats.filter((_, idx) => idx !== i));
    const updateStat = (i: number, field: keyof Stat, val: string) => {
        const copy = [...stats];
        copy[i] = { ...copy[i], [field]: val };
        setStats(copy);
    };

    // Category helpers
    const addCategory = () => setCategories([...categories, { name: "", nameKu: "", nameAr: "", icon: "📁", description: "", descriptionKu: "", descriptionAr: "", color: "from-blue-500 to-cyan-500" }]);
    const removeCategory = (i: number) => setCategories(categories.filter((_, idx) => idx !== i));
    const updateCategory = (i: number, field: keyof Category, val: string) => {
        const copy = [...categories];
        copy[i] = { ...copy[i], [field]: val };
        setCategories(copy);
    };

    const inputClass = "w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:border-transparent transition-all text-sm";

    const tabs = [
        { id: "stats" as const, label: "📊 Stats", count: stats.length },
        { id: "categories" as const, label: "📂 Categories", count: categories.length },
        { id: "cover" as const, label: "📝 Cover Text", count: null },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white">Site Settings</h1>
                    <p className="text-slate-400 text-sm mt-1">Edit homepage stats, categories & content</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#00A8E8]/20 transition-all disabled:opacity-50"
                >
                    {saving ? "Saving..." : "💾 Save All"}
                </button>
            </motion.div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`px-4 py-3 rounded-xl text-sm ${
                        message.startsWith("Error") ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-green-500/10 border border-green-500/20 text-green-400"
                    }`}
                >
                    {message}
                </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? "bg-[#007EA7]/20 text-[#00A8E8] border border-[#007EA7]/30"
                                : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white"
                        }`}
                    >
                        {tab.label} {tab.count !== null && `(${tab.count})`}
                    </button>
                ))}
            </div>

            {/* Stats Tab */}
            {activeTab === "stats" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Homepage Stats</h2>
                        <button onClick={addStat} className="px-3 py-1.5 bg-[#007EA7]/20 text-[#00A8E8] rounded-lg text-xs font-medium hover:bg-[#007EA7]/30 transition-all">
                            + Add Stat
                        </button>
                    </div>
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-400">Stat #{i + 1}</span>
                                <button onClick={() => removeStat(i)} className="text-red-400 hover:text-red-300 text-xs">✕ Remove</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Value</label>
                                    <input value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="e.g. 100+" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Label (EN)</label>
                                    <input value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="e.g. Members" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Label (KU)</label>
                                    <input value={stat.labelKu} onChange={(e) => updateStat(i, "labelKu", e.target.value)} placeholder="ئەندام" className={inputClass} dir="rtl" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Label (AR)</label>
                                    <input value={stat.labelAr} onChange={(e) => updateStat(i, "labelAr", e.target.value)} placeholder="أعضاء" className={inputClass} dir="rtl" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Categories Tab */}
            {activeTab === "categories" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Homepage Categories</h2>
                        <button onClick={addCategory} className="px-3 py-1.5 bg-[#007EA7]/20 text-[#00A8E8] rounded-lg text-xs font-medium hover:bg-[#007EA7]/30 transition-all">
                            + Add Category
                        </button>
                    </div>
                    {categories.map((cat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-400">
                                    <span className="text-lg mr-2">{cat.icon}</span> {cat.name || `Category #${i + 1}`}
                                </span>
                                <button onClick={() => removeCategory(i)} className="text-red-400 hover:text-red-300 text-xs">✕ Remove</button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Icon (emoji)</label>
                                    <input value={cat.icon} onChange={(e) => updateCategory(i, "icon", e.target.value)} placeholder="💻" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Name (EN)</label>
                                    <input value={cat.name} onChange={(e) => updateCategory(i, "name", e.target.value)} placeholder="Technology" className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Color</label>
                                    <select value={cat.color} onChange={(e) => updateCategory(i, "color", e.target.value)} className={inputClass} title="Category color">
                                        {COLOR_OPTIONS.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Name (KU)</label>
                                    <input value={cat.nameKu} onChange={(e) => updateCategory(i, "nameKu", e.target.value)} placeholder="تەکنەلۆژیا" className={inputClass} dir="rtl" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Name (AR)</label>
                                    <input value={cat.nameAr} onChange={(e) => updateCategory(i, "nameAr", e.target.value)} placeholder="التكنولوجيا" className={inputClass} dir="rtl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Desc (EN)</label>
                                    <input value={cat.description} onChange={(e) => updateCategory(i, "description", e.target.value)} placeholder="AI, gadgets..." className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Desc (KU)</label>
                                    <input value={cat.descriptionKu} onChange={(e) => updateCategory(i, "descriptionKu", e.target.value)} placeholder="زیرەکی..." className={inputClass} dir="rtl" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Desc (AR)</label>
                                    <input value={cat.descriptionAr} onChange={(e) => updateCategory(i, "descriptionAr", e.target.value)} placeholder="الذكاء..." className={inputClass} dir="rtl" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Cover Text Tab */}
            {activeTab === "cover" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="text-lg font-bold text-white">&quot;What We Cover&quot; Section Text</h2>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Title (EN)</label>
                                <input value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} placeholder="What We Cover" className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Title (KU)</label>
                                <input value={coverTitleKu} onChange={(e) => setCoverTitleKu(e.target.value)} placeholder="چی لەخۆدەگرین" className={inputClass} dir="rtl" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Title (AR)</label>
                                <input value={coverTitleAr} onChange={(e) => setCoverTitleAr(e.target.value)} placeholder="ما نغطيه" className={inputClass} dir="rtl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Subtitle (EN)</label>
                                <textarea value={coverSubtitle} onChange={(e) => setCoverSubtitle(e.target.value)} rows={3} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Subtitle (KU)</label>
                                <textarea value={coverSubtitleKu} onChange={(e) => setCoverSubtitleKu(e.target.value)} rows={3} className={inputClass} dir="rtl" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Subtitle (AR)</label>
                                <textarea value={coverSubtitleAr} onChange={(e) => setCoverSubtitleAr(e.target.value)} rows={3} className={inputClass} dir="rtl" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
