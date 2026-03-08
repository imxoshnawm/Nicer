"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    ScaleIn,
    StaggerContainer,
    StaggerItem,
    TiltCard,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

export default function AboutPage() {
    const t = useTranslations("AboutPage");
    const nav = useTranslations("Navigation");
    const hp = useTranslations("HomePage");

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="about" />

            {/* Header */}
            <header className="py-16 sm:py-24 px-4 sm:px-6 text-center relative overflow-hidden">
                <FadeInDown>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight relative z-10">
                        {t("title")}
                    </h1>
                </FadeInDown>
                <FadeInUp delay={0.2}>
                    <p className="text-xl sm:text-2xl font-light text-blue-200 tracking-widest mt-4 uppercase relative z-10">
                        {t("slogan")}
                    </p>
                </FadeInUp>
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-px w-full max-w-sm mx-auto bg-gradient-to-r from-transparent via-nicer-blue to-transparent mt-8 opacity-50"
                />
            </header>

            <main className="max-w-6xl mx-auto px-6 mt-12 space-y-32 relative z-10">
                {/* Story Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <FadeInLeft>
                        <div className="space-y-6">
                            <div className="inline-block px-4 py-1 rounded-full border border-nicer-blue/30 bg-nicer-blue/10 text-nicer-blue-light text-sm font-bold uppercase tracking-widest backdrop-blur-sm">
                                {t("ourStory")}
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black">{t("ourStory")}</h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                {t("storyText1")}
                            </p>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                {t("storyText2")}
                            </p>
                        </div>
                    </FadeInLeft>
                    <FadeInRight>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-nicer-blue-dark to-nicer-blue-light rounded-[2rem] opacity-20 blur-2xl animate-pulse"></div>
                            <TiltCard>
                                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] relative z-10"
                                    style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                >
                                    <div className="w-full h-64 bg-slate-800/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                                        <motion.span
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="text-6xl"
                                        >🎓</motion.span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 h-32 bg-slate-800/50 rounded-xl flex items-center justify-center">
                                            <motion.span
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 4, repeat: Infinity }}
                                                className="text-4xl"
                                            >🔬</motion.span>
                                        </div>
                                        <div className="flex-1 h-32 bg-slate-800/50 rounded-xl flex items-center justify-center">
                                            <motion.span
                                                animate={{ y: [0, -8, 0] }}
                                                transition={{ duration: 2.5, repeat: Infinity }}
                                                className="text-4xl"
                                            >🚀</motion.span>
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        </div>
                    </FadeInRight>
                </section>

                {/* Vision & Mission */}
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <StaggerItem>
                        <TiltCard className="h-full">
                            <div className="bg-white/[0.03] backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 hover:border-nicer-blue/30 transition-colors duration-500 group h-full"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-16 h-16 bg-nicer-blue/20 rounded-2xl flex items-center justify-center mb-8"
                                >
                                    <span className="text-3xl">🔭</span>
                                </motion.div>
                                <h3 className="text-3xl font-black mb-4">{t("ourVision")}</h3>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    {t("visionText")}
                                </p>
                            </div>
                        </TiltCard>
                    </StaggerItem>

                    <StaggerItem>
                        <TiltCard className="h-full">
                            <div className="bg-white/[0.03] backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 hover:border-rose-500/30 transition-colors duration-500 group h-full"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-8"
                                >
                                    <span className="text-3xl">🎯</span>
                                </motion.div>
                                <h3 className="text-3xl font-black mb-4">{t("ourMission")}</h3>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    {t("missionText")}
                                </p>
                            </div>
                        </TiltCard>
                    </StaggerItem>
                </StaggerContainer>

                {/* Values Matrix */}
                <section>
                    <FadeInUp>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-black mb-4">{t("ourValues")}</h2>
                            <motion.div
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="w-24 h-1 bg-gradient-to-r from-nicer-blue to-transparent mx-auto rounded-full"
                            />
                        </div>
                    </FadeInUp>

                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {[
                            { title: t("values.community"), icon: "🤝", desc: t("values.communityDesc"), color: "text-blue-400", bg: "bg-blue-400/10" },
                            { title: t("values.innovation"), icon: "💡", desc: t("values.innovationDesc"), color: "text-amber-400", bg: "bg-amber-400/10" },
                            { title: t("values.education"), icon: "📚", desc: t("values.educationDesc"), color: "text-emerald-400", bg: "bg-emerald-400/10" },
                            { title: t("values.diversity"), icon: "🌍", desc: t("values.diversityDesc"), color: "text-purple-400", bg: "bg-purple-400/10" },
                            { title: t("values.growth"), icon: "🚀", desc: t("values.growthDesc"), color: "text-rose-400", bg: "bg-rose-400/10" },
                            { title: t("values.fun"), icon: "🎉", desc: t("values.funDesc"), color: "text-yellow-400", bg: "bg-yellow-400/10" },
                        ].map((value, i) => (
                            <StaggerItem key={i}>
                                <TiltCard className="h-full">
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/[0.06] transition-all duration-300 h-full"
                                        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.2, rotate: 10 }}
                                            className={`w-14 h-14 ${value.bg} ${value.color} rounded-2xl flex items-center justify-center text-2xl mb-6`}
                                        >
                                            {value.icon}
                                        </motion.div>
                                        <h4 className="text-xl font-bold mb-2">{value.title}</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed">{value.desc}</p>
                                    </div>
                                </TiltCard>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </section>

                {/* Site Map Section */}
                <FadeInUp>
                    <section className="bg-white/[0.03] backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-white/10 relative overflow-hidden"
                        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                    >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-nicer-blue/5 to-transparent rounded-full blur-3xl"></div>

                        <h2 className="text-3xl font-black mb-10">{t("siteMap")}</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                            <div>
                                <h4 className="text-nicer-blue-light font-bold mb-4 uppercase tracking-wider text-sm">{t("siteMapMain")}</h4>
                                <ul className="space-y-3">
                                    <li><a href="/" className="text-slate-400 hover:text-nicer-blue-light transition-colors">{t("home")}</a></li>
                                    <li><a href="/about" className="text-white font-medium">{nav("about")}</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-nicer-blue-light font-bold mb-4 uppercase tracking-wider text-sm">{t("siteMapActivities")}</h4>
                                <ul className="space-y-3">
                                    <li><a href="/news" className="text-slate-400 hover:text-nicer-blue-light transition-colors">{nav("news")}</a></li>
                                    <li><a href="/activities" className="text-slate-400 hover:text-nicer-blue-light transition-colors">{nav("activities")}</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-nicer-blue-light font-bold mb-4 uppercase tracking-wider text-sm">{t("siteMapCategories")}</h4>
                                <ul className="space-y-3 gap-2 flex flex-col">
                                    <li className="text-slate-400">{hp("categories.Technology.title")}</li>
                                    <li className="text-slate-400">{hp("categories.Science.title")}</li>
                                    <li className="text-slate-400">{hp("categories.Sports.title")}</li>
                                    <li className="text-slate-400">{hp("categories.Entertainment.title")}</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-nicer-blue-light font-bold mb-4 uppercase tracking-wider text-sm">{t("siteMapConnect")}</h4>
                                <ul className="space-y-3">
                                    <li><a href="/contact" className="text-slate-400 hover:text-nicer-blue-light transition-colors">{nav("contact")}</a></li>
                                    <li><a href="/auth/register" className="text-slate-400 hover:text-nicer-blue-light transition-colors">{t("joinClub")}</a></li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </FadeInUp>
            </main>
        </div>
    );
}
