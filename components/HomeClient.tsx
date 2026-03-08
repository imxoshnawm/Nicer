"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import {
    FadeInUp,
    FadeInDown,
    ScaleIn,
    StaggerContainer,
    StaggerItem,
    FloatingElement,
    TiltCard,
    GlowButton,
    AnimatedCounter,
    motion,
} from "@/components/MotionElements";

// Lazy load 3D background for better performance
const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

interface HomeClientProps {
    posts: any[];
    translations: {
        title: string;
        slogan: string;
        description: string;
        exploreButton: string;
        joinButton: string;
        whatWeCover: string;
        whatWeCoverDesc: string;
        latestNews: string;
        latestNewsDesc: string;
        viewAllNews: string;
        readyToJoin: string;
        readyToJoinDesc: string;
        createAccount: string;
        statFounded: string;
        statMembers: string;
        statActivities: string;
        statLanguages: string;
        catTechTitle: string;
        catTechDesc: string;
        catSciTitle: string;
        catSciDesc: string;
        catSportsTitle: string;
        catSportsDesc: string;
        catEntTitle: string;
        catEntDesc: string;
        footerNicerClub: string;
        footerSlogan: string;
        footerQuickLinks: string;
        footerContact: string;
        navAbout: string;
        navNews: string;
        navActivities: string;
        navContact: string;
        copyright: string;
    };
    settings?: any;
    locale?: string;
}

export default function HomeClient({ posts, translations: t, settings, locale = 'en' }: HomeClientProps) {
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white overflow-hidden relative">
            <Background3D variant="hero" />

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center p-8 sm:p-20">
                <div className="flex flex-col gap-10 items-center text-center z-10 max-w-4xl mx-auto">
                    {/* Logo */}
                    <ScaleIn>
                        <FloatingElement duration={4}>
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-nicer-blue-dark to-nicer-blue-light flex items-center justify-center transform-gpu"
                                style={{
                                    boxShadow: "0 0 80px rgba(0,168,232,0.5), 0 0 160px rgba(0,168,232,0.2)",
                                    transformStyle: "preserve-3d",
                                    perspective: "1000px",
                                }}
                            >
                                <span className="text-5xl font-black text-white tracking-tighter">NC</span>
                            </div>
                        </FloatingElement>
                    </ScaleIn>

                    {/* Title */}
                    <FadeInDown delay={0.2}>
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-nicer-blue-light tracking-tight">
                            {t.title}
                        </h1>
                    </FadeInDown>

                    {/* Slogan */}
                    <FadeInUp delay={0.4}>
                        <p className="text-lg sm:text-2xl md:text-3xl font-light text-blue-200 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                            {t.slogan}
                        </p>
                    </FadeInUp>

                    {/* Divider */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-nicer-blue to-transparent opacity-50"
                    />

                    {/* Description */}
                    <FadeInUp delay={0.7}>
                        <p className="text-lg text-slate-300 text-center max-w-2xl leading-relaxed">{t.description}</p>
                    </FadeInUp>

                    {/* CTA Buttons */}
                    <FadeInUp delay={0.9} className="flex gap-6 items-center flex-col sm:flex-row mt-6">
                        <GlowButton className="rounded-full">
                            <Link
                                className="rounded-full flex items-center justify-center bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white gap-2 text-lg h-14 px-8 font-semibold w-full sm:w-auto"
                                href="/news"
                            >
                                {t.exploreButton}
                            </Link>
                        </GlowButton>
                        {!isLoggedIn && (
                            <GlowButton className="rounded-full">
                                <Link
                                    className="rounded-full border border-slate-600/50 backdrop-blur-md flex items-center justify-center hover:bg-white/5 text-white gap-2 text-lg h-14 px-8 font-semibold w-full sm:w-auto"
                                    href="/auth/register"
                                >
                                    {t.joinButton}
                                </Link>
                            </GlowButton>
                        )}
                    </FadeInUp>

                    {/* Scroll indicator */}
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-10"
                    >
                        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
                            <motion.div
                                animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-nicer-blue-light"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 relative z-10">
                <StaggerContainer className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {(settings?.stats || [
                        { value: "2024", label: "Founded" },
                        { value: "100+", label: "Members" },
                        { value: "50+", label: "Activities" },
                        { value: "3", label: "Languages" },
                    ]).map((stat: any) => {
                        const labelMap: Record<string, string> = {
                            'Founded': t.statFounded,
                            'Members': t.statMembers,
                            'Activities': t.statActivities,
                            'Languages': t.statLanguages,
                        };
                        const label = locale === 'ku' ? (stat.labelKu || labelMap[stat.label] || stat.label) : locale === 'ar' ? (stat.labelAr || labelMap[stat.label] || stat.label) : (labelMap[stat.label] || stat.label);
                        return (
                        <StaggerItem key={stat.label}>
                            <TiltCard>
                                <div className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] transition-colors"
                                    style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                >
                                    <AnimatedCounter
                                        value={stat.value}
                                        className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-nicer-blue-light to-white block"
                                    />
                                    <p className="text-slate-400 mt-2 text-sm uppercase tracking-wider">{label}</p>
                                </div>
                            </TiltCard>
                        </StaggerItem>
                    )})}
                </StaggerContainer>
            </section>

            {/* Categories Section */}
            <section className="py-20 px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <FadeInUp>
                        <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
                            {locale === 'ku' ? (settings?.coverTitleKu || settings?.coverTitle || t.whatWeCover) : locale === 'ar' ? (settings?.coverTitleAr || settings?.coverTitle || t.whatWeCover) : (settings?.coverTitle || t.whatWeCover)}
                        </h2>
                    </FadeInUp>
                    <FadeInUp delay={0.1}>
                        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
                            {locale === 'ku' ? (settings?.coverSubtitleKu || settings?.coverSubtitle || t.whatWeCoverDesc) : locale === 'ar' ? (settings?.coverSubtitleAr || settings?.coverSubtitle || t.whatWeCoverDesc) : (settings?.coverSubtitle || t.whatWeCoverDesc)}
                        </p>
                    </FadeInUp>

                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(settings?.categories || [
                            { name: "Technology", icon: "💻", description: "AI, gadgets, apps & future tech", color: "from-blue-500 to-cyan-500" },
                            { name: "Science", icon: "🔬", description: "Space, discoveries & facts", color: "from-green-500 to-emerald-500" },
                            { name: "Sports", icon: "⚽", description: "Competitions & fitness", color: "from-orange-500 to-amber-500" },
                            { name: "Entertainment", icon: "🎬", description: "Viral content & trends", color: "from-purple-500 to-pink-500" },
                        ]).map((cat: any) => {
                            const catNames: Record<string, string> = { Technology: t.catTechTitle, Science: t.catSciTitle, Sports: t.catSportsTitle, Entertainment: t.catEntTitle };
                            const catDescs: Record<string, string> = { Technology: t.catTechDesc, Science: t.catSciDesc, Sports: t.catSportsDesc, Entertainment: t.catEntDesc };
                            const catName = locale === 'ku' ? (cat.nameKu || catNames[cat.name] || cat.name) : locale === 'ar' ? (cat.nameAr || catNames[cat.name] || cat.name) : (catNames[cat.name] || cat.name);
                            const catDesc = locale === 'ku' ? (cat.descriptionKu || catDescs[cat.name] || cat.description) : locale === 'ar' ? (cat.descriptionAr || catDescs[cat.name] || cat.description) : (catDescs[cat.name] || cat.description);
                            return (
                            <StaggerItem key={cat.name}>
                                <TiltCard className="h-full">
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:bg-white/[0.06] group cursor-pointer h-full"
                                        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                    >
                                        <motion.span
                                            whileHover={{ scale: 1.3, rotate: 10 }}
                                            className="text-5xl mb-4 block"
                                        >
                                            {cat.icon}
                                        </motion.span>
                                        <h3 className="text-xl font-bold text-white group-hover:text-nicer-blue-light transition-colors">{catName}</h3>
                                        <p className="text-sm text-slate-400 mt-2">{catDesc}</p>
                                        <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${cat.color} mt-4 opacity-60`}></div>
                                    </div>
                                </TiltCard>
                            </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                </div>
            </section>

            {/* Latest News Section */}
            {posts.length > 0 && (
                <section className="py-20 px-6 relative z-10">
                    <div className="max-w-6xl mx-auto">
                        <FadeInUp>
                            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">{t.latestNews}</h2>
                        </FadeInUp>
                        <FadeInUp delay={0.1}>
                            <p className="text-slate-400 text-center mb-12">{t.latestNewsDesc}</p>
                        </FadeInUp>

                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post: any) => (
                                <StaggerItem key={post._id}>
                                    <TiltCard>
                                        <Link href={`/news/${post._id}`} className="block group">
                                            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/[0.06]"
                                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                            >
                                                {post.imageUrl && (
                                                    <div className="w-full h-48 bg-slate-800/50 overflow-hidden">
                                                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                )}
                                                <div className="p-6">
                                                    <span className="text-xs font-medium text-nicer-blue-light uppercase tracking-wider">{post.category}</span>
                                                    <h3 className="text-lg font-bold text-white mt-2 group-hover:text-nicer-blue-light transition-colors">{post.title}</h3>
                                                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">{post.content?.substring(0, 120)}...</p>
                                                    <p className="text-slate-500 text-xs mt-4">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </TiltCard>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>

                        <FadeInUp delay={0.3}>
                            <div className="text-center mt-10">
                                <Link href="/news" className="text-nicer-blue-light hover:text-white transition-colors font-medium">
                                    {t.viewAllNews}
                                </Link>
                            </div>
                        </FadeInUp>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            {!isLoggedIn && (
            <section className="py-24 px-6 relative z-10">
                <FadeInUp>
                    <div className="max-w-3xl mx-auto text-center relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-nicer-blue-dark/10 to-nicer-blue/10 rounded-3xl blur-xl" />
                        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-12"
                            style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                        >
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6">{t.readyToJoin}</h2>
                            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
                                {t.readyToJoinDesc}
                            </p>
                            <GlowButton className="inline-block rounded-full">
                                <Link
                                    href="/auth/register"
                                    className="inline-block rounded-full bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white text-lg h-14 px-10 font-semibold leading-[3.5rem]"
                                >
                                    {t.createAccount}
                                </Link>
                            </GlowButton>
                        </div>
                    </div>
                </FadeInUp>
            </section>
            )}

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6 relative z-10 backdrop-blur-sm">
                <StaggerContainer className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <StaggerItem>
                        <h3 className="text-xl font-black text-white mb-4">{t.footerNicerClub}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{t.footerSlogan}</p>
                    </StaggerItem>
                    <StaggerItem>
                        <h4 className="font-bold text-white mb-4">{t.footerQuickLinks}</h4>
                        <div className="flex flex-col gap-2">
                            <Link href="/about" className="text-slate-400 hover:text-nicer-blue-light text-sm transition-colors">{t.navAbout}</Link>
                            <Link href="/news" className="text-slate-400 hover:text-nicer-blue-light text-sm transition-colors">{t.navNews}</Link>
                            <Link href="/activities" className="text-slate-400 hover:text-nicer-blue-light text-sm transition-colors">{t.navActivities}</Link>
                            <Link href="/contact" className="text-slate-400 hover:text-nicer-blue-light text-sm transition-colors">{t.navContact}</Link>
                        </div>
                    </StaggerItem>
                    <StaggerItem>
                        <h4 className="font-bold text-white mb-4">{t.footerContact}</h4>
                        <div className="flex flex-col gap-2 text-sm text-slate-400">
                            <p>📞 +964 750 71 86 190</p>
                            <p>✉️ nicer.club@gmail.com</p>
                        </div>
                    </StaggerItem>
                </StaggerContainer>
                <FadeInUp>
                    <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
                        {t.copyright.replace('{year}', new Date().getFullYear().toString())}
                    </div>
                </FadeInUp>
            </footer>
        </div>
    );
}
