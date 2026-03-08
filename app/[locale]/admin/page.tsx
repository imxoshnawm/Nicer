"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function AdminDashboard() {
    const { data: session } = useSession();
    const t = useTranslations("AdminDashboard");
    const roles: string[] = (session?.user as any)?.roles || [(session?.user as any)?.role || 'member'];
    const isAdmin = roles.includes("admin");

    const [stats, setStats] = useState({ posts: 0, published: 0, drafts: 0, pending: 0, rejected: 0, users: 0, blocked: 0, messages: 0, unread: 0, activities: 0, upcoming: 0 });
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const fetches: Promise<Response>[] = [secureFetch("/api/posts"), secureFetch("/api/activities")];
                if (isAdmin) {
                    fetches.push(secureFetch("/api/users"), secureFetch("/api/contact"));
                }
                const responses = await Promise.all(fetches);
                const [posts, acts] = await Promise.all([responses[0].json(), responses[1].json()]);
                let users: any[] = [], msgs: any[] = [];
                if (isAdmin && responses[2]?.ok) users = await responses[2].json();
                if (isAdmin && responses[3]?.ok) msgs = await responses[3].json();

                setStats({
                    posts: posts.length,
                    published: posts.filter((p: any) => p.published).length,
                    drafts: posts.filter((p: any) => !p.published && p.approvalStatus !== 'pending' && p.approvalStatus !== 'rejected').length,
                    pending: posts.filter((p: any) => p.approvalStatus === "pending").length,
                    rejected: posts.filter((p: any) => p.approvalStatus === "rejected").length,
                    users: users.length,
                    blocked: users.filter((u: any) => u.blocked).length,
                    messages: msgs.length,
                    unread: msgs.filter((m: any) => !m.read).length,
                    activities: acts.length,
                    upcoming: acts.filter((a: any) => a.status === 'upcoming').length,
                });
                setRecentPosts(posts.slice(0, 5));
                setRecentActivities(acts.slice(0, 3));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (session) fetchAll();
    }, [session, isAdmin]);

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
    const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
        </div>
    );

    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening');

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Welcome Banner */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#003459]/40 to-[#007EA7]/20 border border-[#007EA7]/20 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">{greeting}, {session?.user?.name?.split(' ')[0]} 👋</h1>
                        <p className="text-slate-400 text-xs sm:text-sm mt-1">
                            {stats.pending > 0
                                ? t('pendingReview', { count: stats.pending })
                                : stats.unread > 0
                                    ? t('unreadMessages', { count: stats.unread })
                                    : t('allGood')
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/posts/new"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-semibold text-xs sm:text-sm hover:shadow-lg hover:scale-[1.03] transition-all">
                            ✏️ {t('newPost')}
                        </Link>
                        {isAdmin && (
                            <Link href="/admin/activities/new"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/[0.06] text-white rounded-xl font-semibold text-xs sm:text-sm hover:bg-white/[0.1] transition-all border border-white/[0.08]">
                                ➕ {t('activity')}
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Alert Cards (pending/unread) */}
            {(stats.pending > 0 || stats.unread > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stats.pending > 0 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                            <Link href="/admin/approvals"
                                className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/15 transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg shrink-0">⏳</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-amber-400 font-semibold text-sm">{stats.pending} {stats.pending > 1 ? t('pendingApprovals') : t('pendingApproval')}</p>
                                    <p className="text-amber-400/60 text-xs">{t('postsWaiting')}</p>
                                </div>
                                <span className="text-amber-400/40 group-hover:text-amber-400 transition-colors">→</span>
                            </Link>
                        </motion.div>
                    )}
                    {stats.unread > 0 && isAdmin && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                            <Link href="/admin/messages"
                                className="flex items-center gap-3 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl hover:bg-pink-500/15 transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-lg shrink-0">💬</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-pink-400 font-semibold text-sm">{stats.unread} {stats.unread > 1 ? t('unreadMsgs') : t('unreadMessage')}</p>
                                    <p className="text-pink-400/60 text-xs">{t('newContactSubmissions')}</p>
                                </div>
                                <span className="text-pink-400/40 group-hover:text-pink-400 transition-colors">→</span>
                            </Link>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Posts overview */}
                <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">📝</span>
                        <Link href="/admin/posts" className="text-[10px] text-slate-500 hover:text-[#00A8E8] transition-colors">View →</Link>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#007EA7] to-[#00A8E8]">{stats.posts}</p>
                    <p className="text-slate-500 text-[11px] mt-1">{t('totalPosts')}</p>
                    <div className="flex gap-2 mt-2 text-[10px]">
                        <span className="text-green-400">{stats.published} {t('live')}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{stats.drafts} {t('draft')}</span>
                    </div>
                </motion.div>

                {/* Activities */}
                <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">📅</span>
                        {isAdmin && <Link href="/admin/activities" className="text-[10px] text-slate-500 hover:text-[#00A8E8] transition-colors">View →</Link>}
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">{stats.activities}</p>
                    <p className="text-slate-500 text-[11px] mt-1">{t('activity')}</p>
                    <div className="flex gap-2 mt-2 text-[10px]">
                        <span className="text-blue-400">{stats.upcoming} {t('upcoming')}</span>
                    </div>
                </motion.div>

                {isAdmin && (
                    <>
                        {/* Users */}
                        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xl">👥</span>
                                <Link href="/admin/users" className="text-[10px] text-slate-500 hover:text-[#00A8E8] transition-colors">View →</Link>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">{stats.users}</p>
                            <p className="text-slate-500 text-[11px] mt-1">{t('users')}</p>
                            {stats.blocked > 0 && (
                                <div className="flex gap-2 mt-2 text-[10px]">
                                    <span className="text-red-400">{stats.blocked} {t('blocked')}</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Messages */}
                        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xl">💬</span>
                                <Link href="/admin/messages" className="text-[10px] text-slate-500 hover:text-[#00A8E8] transition-colors">View →</Link>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">{stats.messages}</p>
                            <p className="text-slate-500 text-[11px] mt-1">{t('messages')}</p>
                            {stats.unread > 0 && (
                                <div className="flex gap-2 mt-2 text-[10px]">
                                    <span className="text-pink-400">{stats.unread} {t('unread')}</span>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* Two Column: Recent Posts + Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Posts */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">📝 {t('recentPosts')}</h2>
                        <Link href="/admin/posts" className="text-[#00A8E8] text-xs hover:text-white transition-colors">{t('viewAll')}</Link>
                    </div>
                    {recentPosts.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-500 text-sm">{t('noPostsYet')}</p>
                            <Link href="/admin/posts/new" className="inline-block mt-2 text-[#00A8E8] text-xs hover:text-white transition-colors">{t('createFirstPost')}</Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {recentPosts.map((post: any) => {
                                const statusConfig = post.published
                                    ? { label: t('published'), icon: '🟢', color: 'bg-green-500/15 text-green-400' }
                                    : post.approvalStatus === 'pending'
                                        ? { label: t('pending'), icon: '🟡', color: 'bg-amber-500/15 text-amber-400' }
                                        : post.approvalStatus === 'rejected'
                                            ? { label: t('rejected'), icon: '🔴', color: 'bg-red-500/15 text-red-400' }
                                            : { label: t('draftStatus'), icon: '⚪', color: 'bg-slate-500/15 text-slate-400' };
                                return (
                                    <div key={post._id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                                        {post.imageUrl ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/[0.02]">
                                                <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                                                <span className="text-slate-600 text-sm">📝</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-xs sm:text-sm truncate">{post.title}</p>
                                            <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">{post.author} · {new Date(post.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusConfig.color}`}>
                                            {statusConfig.icon} {statusConfig.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Quick Actions & Activities */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">⚡ {t('quickActions')}</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <Link href="/admin/posts/new" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#007EA7]/10 hover:border-[#007EA7]/30 transition-all text-center group">
                                <span className="text-lg">✏️</span>
                                <span className="text-[10px] text-slate-400 group-hover:text-[#00A8E8] font-medium">{t('newPost')}</span>
                            </Link>
                            {isAdmin && (
                                <>
                                    <Link href="/admin/activities/new" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-green-500/10 hover:border-green-500/30 transition-all text-center group">
                                        <span className="text-lg">📅</span>
                                        <span className="text-[10px] text-slate-400 group-hover:text-green-400 font-medium">{t('activity')}</span>
                                    </Link>
                                    <Link href="/admin/approvals" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-center group">
                                        <span className="text-lg">📋</span>
                                        <span className="text-[10px] text-slate-400 group-hover:text-amber-400 font-medium">{t('approvals')}</span>
                                    </Link>
                                    <Link href="/admin/users" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-center group">
                                        <span className="text-lg">👥</span>
                                        <span className="text-[10px] text-slate-400 group-hover:text-purple-400 font-medium">{t('users')}</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Activities */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">📅 {t('activity')}</h2>
                            {isAdmin && <Link href="/admin/activities" className="text-[#00A8E8] text-xs hover:text-white transition-colors">{t('all')}</Link>}
                        </div>
                        {recentActivities.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-xs">{t('noActivities')}</div>
                        ) : (
                            <div className="divide-y divide-white/[0.04]">
                                {recentActivities.map((act: any) => {
                                    const statusColor = act.status === 'upcoming' ? 'text-blue-400' : act.status === 'ongoing' ? 'text-green-400' : 'text-slate-400';
                                    return (
                                        <div key={act._id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                            <p className="text-white text-xs font-medium truncate">{act.title}</p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px]">
                                                <span className={statusColor}>{act.status}</span>
                                                <span className="text-slate-600">·</span>
                                                <span className="text-slate-500">{new Date(act.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
