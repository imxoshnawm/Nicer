"use client";

import secureFetch from '@/lib/secureFetch';
import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

interface KnowledgeItem {
    _id: string;
    title: string;
    content: string;
    category: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const CATEGORIES = ['general', 'faq', 'rules', 'events', 'custom'] as const;

const CATEGORY_ICONS: Record<string, string> = {
    general: '📋',
    faq: '❓',
    rules: '📜',
    events: '📅',
    custom: '🔧',
};

const CATEGORY_COLORS: Record<string, string> = {
    general: 'bg-blue-500/15 text-blue-400',
    faq: 'bg-amber-500/15 text-amber-400',
    rules: 'bg-red-500/15 text-red-400',
    events: 'bg-green-500/15 text-green-400',
    custom: 'bg-purple-500/15 text-purple-400',
};

export default function AdminAIKnowledgePage() {
    const { hasPerm } = useAdmin();
    const locale = useLocale();
    const t = useTranslations("AdminAI");

    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '', category: 'general', isActive: true });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const canManage = hasPerm('ai.manage');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await secureFetch('/api/ai-knowledge');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) return;
        setSaving(true);

        try {
            const url = editingItem ? `/api/ai-knowledge/${editingItem._id}` : '/api/ai-knowledge';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await secureFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchItems();
                resetForm();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: KnowledgeItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            category: item.category,
            isActive: item.isActive,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await secureFetch(`/api/ai-knowledge/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setItems(items.filter(i => i._id !== id));
                setDeleteConfirm(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleActive = async (item: KnowledgeItem) => {
        try {
            const res = await secureFetch(`/api/ai-knowledge/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !item.isActive }),
            });
            if (res.ok) {
                setItems(items.map(i => i._id === item._id ? { ...i, isActive: !i.isActive } : i));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ title: '', content: '', category: 'general', isActive: true });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                        🧠 {t("title")}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{t("subtitle")}</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:scale-[1.03] transition-all"
                    >
                        ➕ {t("addKnowledge")}
                    </button>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-[#003459]/40 to-[#007EA7]/20 border border-[#007EA7]/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h3 className="text-white font-bold text-sm mb-1">{t("infoTitle")}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">{t("infoDesc")}</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#007EA7] to-[#00A8E8]">{items.length}</p>
                    <p className="text-slate-500 text-[11px] mt-1">{t("totalItems")}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{items.filter(i => i.isActive).length}</p>
                    <p className="text-slate-500 text-[11px] mt-1">{t("activeItems")}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-amber-400">{items.filter(i => !i.isActive).length}</p>
                    <p className="text-slate-500 text-[11px] mt-1">{t("inactiveItems")}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-purple-400">{new Set(items.map(i => i.category)).size}</p>
                    <p className="text-slate-500 text-[11px] mt-1">{t("categories")}</p>
                </div>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-bold text-white mb-4">
                            {editingItem ? t("editKnowledge") : t("addKnowledge")}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t("titleLabel")}</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        maxLength={200}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] transition-all"
                                        placeholder={t("titlePlaceholder")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t("categoryLabel")}</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] transition-all"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{CATEGORY_ICONS[c]} {t(`cat_${c}`)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">{t("contentLabel")}</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    maxLength={10000}
                                    rows={6}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8] transition-all resize-y"
                                    placeholder={t("contentPlaceholder")}
                                />
                                <p className="text-slate-600 text-xs">{formData.content.length}/10000</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-[#00A8E8]/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A8E8]"></div>
                                </label>
                                <span className="text-sm text-slate-300">{t("activeLabel")}</span>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {saving ? '...' : editingItem ? t("save") : t("add")}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2.5 bg-white/[0.06] text-white rounded-xl font-semibold text-sm hover:bg-white/[0.1] transition-all"
                                >
                                    {t("cancel")}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Items List */}
            {items.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">🧠</span>
                    <p className="text-slate-400 text-sm">{t("noItems")}</p>
                    {canManage && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-[#00A8E8] text-sm hover:text-white transition-colors"
                        >
                            {t("addFirst")} →
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white/[0.03] border rounded-xl p-4 transition-all ${
                                item.isActive ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl mt-0.5">{CATEGORY_ICONS[item.category] || '📋'}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general}`}>
                                            {t(`cat_${item.category}`)}
                                        </span>
                                        {!item.isActive && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/15 text-red-400">
                                                {t("inactive")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 whitespace-pre-wrap">
                                        {item.content}
                                    </p>
                                    <p className="text-slate-600 text-[10px] mt-2">
                                        {new Date(item.updatedAt).toLocaleDateString(locale === 'ku' ? 'ckb' : locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>

                                {canManage && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleToggleActive(item)}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                item.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-500/10'
                                            }`}
                                            title={item.isActive ? t("deactivate") : t("activate")}
                                        >
                                            {item.isActive ? '✅' : '⬜'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                                            title={t("edit")}
                                        >
                                            ✏️
                                        </button>
                                        {deleteConfirm === item._id ? (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/30 transition-colors"
                                                >
                                                    {t("confirmDelete")}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-2 py-1 rounded-lg bg-white/[0.06] text-slate-400 text-[10px] font-semibold hover:bg-white/[0.1] transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(item._id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                title={t("delete")}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
