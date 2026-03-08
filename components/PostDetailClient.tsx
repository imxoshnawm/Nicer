"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

interface PostDetailClientProps {
    post: any;
    locale: string;
    translations: {
        backToNews: string;
        by: string;
        category: string;
        publishedOn: string;
        sharePost: string;
    };
}

const categoryStyles: Record<string, { icon: string; color: string; bg: string; border: string }> = {
    tech: { icon: "🤖", color: "text-nicer-blue", bg: "bg-nicer-blue/10", border: "border-nicer-blue/20" },
    science: { icon: "🔬", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    sports: { icon: "⚽", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
    entertainment: { icon: "🎬", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
    other: { icon: "📰", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
};

export default function PostDetailClient({ post, locale, translations: t }: PostDetailClientProps) {
    const isRTL = locale === 'ku' || locale === 'ar';
    const title = locale === 'ku' ? (post.titleKu || post.title) : locale === 'ar' ? (post.titleAr || post.title) : post.title;
    const content = locale === 'ku' ? (post.contentKu || post.content) : locale === 'ar' ? (post.contentAr || post.content) : post.content;
    const catStyle = categoryStyles[post.category] || categoryStyles.other;
    const authorName = typeof post.author === 'object' ? post.author?.name : post.author || 'NICER';
    const dateStr = new Date(post.createdAt).toLocaleDateString(
        locale === 'ku' || locale === 'ar' ? 'ar-EG' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' }
    );

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            alert('Link copied!');
        }
    };

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <Background3D variant="news" />

            {/* Hero Image / Category Banner */}
            <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
                {post.imageUrl ? (
                    <>
                        <Image
                            src={post.imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#00171F] via-[#00171F]/60 to-transparent" />
                    </>
                ) : (
                    <div className={`absolute inset-0 ${catStyle.bg} flex items-center justify-center`}>
                        <motion.span
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 6, repeat: Infinity }}
                            className="text-[120px] opacity-20 blur-sm absolute"
                        >{catStyle.icon}</motion.span>
                        <motion.span
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-8xl relative z-10"
                        >{catStyle.icon}</motion.span>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#00171F] via-[#00171F]/40 to-transparent" />
                    </div>
                )}

                {/* Back Button */}
                <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
                    <Link
                        href={`/${locale}/news`}
                        className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-sm text-white/80 hover:text-white hover:bg-black/60 transition-all flex items-center gap-2"
                    >
                        {t.backToNews}
                    </Link>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
                <FadeInUp>
                    <article className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                        {/* Header */}
                        <div className="p-6 sm:p-10 pb-0">
                            {/* Category + Date */}
                            <FadeInDown delay={0.1}>
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.color} ${catStyle.border} border flex items-center gap-1.5`}>
                                        <span>{catStyle.icon}</span>
                                        {post.category}
                                    </span>
                                    <span className="text-slate-500 text-sm">
                                        {t.publishedOn} {dateStr}
                                    </span>
                                </div>
                            </FadeInDown>

                            {/* Title */}
                            <FadeInUp delay={0.2}>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                                    {title}
                                </h1>
                            </FadeInUp>

                            {/* Author bar */}
                            <FadeInUp delay={0.3}>
                                <div className="flex items-center justify-between py-6 border-y border-white/[0.06]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#003459] to-[#007EA7] flex items-center justify-center text-lg font-bold text-white">
                                            {authorName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{authorName}</p>
                                            <p className="text-slate-500 text-sm">{t.by} NICER Club</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleShare}
                                        className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        {t.sharePost}
                                    </button>
                                </div>
                            </FadeInUp>
                        </div>

                        {/* Post Content */}
                        <FadeInUp delay={0.4}>
                            <div className="p-6 sm:p-10 pt-8">
                                <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {content}
                                </div>
                            </div>
                        </FadeInUp>

                        {/* Footer */}
                        <div className="p-6 sm:p-10 pt-0">
                            <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
                                <Link
                                    href={`/${locale}/news`}
                                    className="text-[#00A8E8] hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    {t.backToNews}
                                </Link>

                                <button
                                    onClick={handleShare}
                                    className="text-slate-500 hover:text-[#00A8E8] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </article>
                </FadeInUp>
            </main>
        </div>
    );
}
