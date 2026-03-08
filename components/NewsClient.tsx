"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    StaggerContainer,
    StaggerItem,
    TiltCard,
    ScaleIn,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

interface NewsClientProps {
    posts: any[];
    locale: string;
    translations: {
        title: string;
        subtitle: string;
        noPosts: string;
        all: string;
        tech: string;
        science: string;
        sports: string;
        entertainment: string;
        other: string;
    };
}

export default function NewsClient({ posts, locale, translations: t }: NewsClientProps) {
    const categories = [
        { id: "All", label: t.all },
        { id: "Technology", label: t.tech },
        { id: "Science", label: t.science },
        { id: "Sports", label: t.sports },
        { id: "Entertainment", label: t.entertainment },
        { id: "Other", label: t.other },
    ];

    const getIcon = (cat: string) => {
        if (cat === "Technology") return { icon: "🤖", color: "text-nicer-blue", bg: "bg-nicer-blue/10", border: "border-nicer-blue/20" };
        if (cat === "Science") return { icon: "🔬", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" };
        if (cat === "Sports") return { icon: "⚽", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" };
        if (cat === "Entertainment") return { icon: "🎬", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" };
        return { icon: "📰", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
    };

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="news" />

            {/* Header */}
            <header className="py-16 sm:py-24 px-4 sm:px-6 text-center relative overflow-hidden">
                <FadeInDown>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight relative z-10">
                        {t.title}
                    </h1>
                </FadeInDown>
                <FadeInUp delay={0.2}>
                    <p className="text-xl text-slate-400 mt-4 max-w-2xl mx-auto relative z-10">
                        {t.subtitle}
                    </p>
                </FadeInUp>
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-px w-full max-w-sm mx-auto bg-gradient-to-r from-transparent via-nicer-blue to-transparent mt-8 opacity-50"
                />
            </header>

            <main className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
                {/* Category Filters */}
                <FadeInUp delay={0.3}>
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:border-nicer-blue/50 hover:bg-nicer-blue/10 transition-colors cursor-pointer text-slate-300"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                            >
                                {cat.label}
                            </motion.div>
                        ))}
                    </div>
                </FadeInUp>

                {posts.length === 0 ? (
                    <ScaleIn>
                        <div className="text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10"
                            style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                        >
                            <motion.span
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-6xl mb-4 block"
                            >📭</motion.span>
                            <h3 className="text-2xl font-bold text-white mb-2">{t.noPosts}</h3>
                            <p className="text-slate-400">Check back later for exciting updates!</p>
                        </div>
                    </ScaleIn>
                ) : (
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {posts.map((post: any) => {
                            const title = locale === 'ku' ? (post.titleKu || post.title) : locale === 'ar' ? (post.titleAr || post.title) : post.title;
                            const description = locale === 'ku' ? (post.contentKu || post.content || '') : locale === 'ar' ? (post.contentAr || post.content || '') : (post.content || '');
                            const catStyle = getIcon(post.category);

                            return (
                                <StaggerItem key={post._id}>
                                    <TiltCard>
                                        <article className="group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-nicer-blue/30 transition-all duration-500 flex flex-col h-full"
                                            style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                        >
                                            {/* Category Visual / Post Image */}
                                            <div className={`w-full h-48 ${!post.imageUrl ? catStyle.bg : ''} flex items-center justify-center relative overflow-hidden`}>
                                                {post.imageUrl ? (
                                                    <>
                                                        <Image
                                                            src={post.imageUrl}
                                                            alt={title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#00171F] to-transparent z-10" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#00171F] to-transparent z-10" />
                                                        <motion.span
                                                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                                            transition={{ duration: 6, repeat: Infinity }}
                                                            className="text-7xl opacity-30 absolute blur-sm"
                                                        >{catStyle.icon}</motion.span>
                                                        <motion.span
                                                            whileHover={{ scale: 1.2 }}
                                                            className="text-6xl relative z-20"
                                                        >{catStyle.icon}</motion.span>
                                                    </>
                                                )}

                                                <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-slate-300">
                                                    {post.published ? "Live" : "Draft"}
                                                </div>
                                            </div>

                                            <div className="p-8 flex flex-col flex-grow relative z-20">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.color} ${catStyle.border} border`}>
                                                        {post.category}
                                                    </span>
                                                    <span className="text-slate-500 text-sm font-medium">
                                                        {new Date(post.createdAt).toLocaleDateString(locale === "ku" || locale === "ar" ? "ar-EG" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                </div>

                                                <h2 className="text-2xl font-bold text-white mb-4 line-clamp-2 group-hover:text-nicer-blue-light transition-colors leading-tight">
                                                    {title}
                                                </h2>

                                                <p className="text-slate-400 mb-8 line-clamp-3 text-sm leading-relaxed flex-grow">
                                                    {description}
                                                </p>

                                                {/* Author & Action */}
                                                <div className="pt-6 border-t border-white/5 mt-auto flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-lg">
                                                            {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "👨‍💻"}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{post.author?.name || "NICER Author"}</p>
                                                            <p className="text-xs text-slate-500">Club Member</p>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={`/${locale}/news/${post._id}`}
                                                        className="w-10 h-10 rounded-full bg-nicer-blue/10 flex items-center justify-center text-nicer-blue-light hover:bg-nicer-blue hover:text-white transition-all"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    </TiltCard>
                                </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                )}
            </main>
        </div>
    );
}
