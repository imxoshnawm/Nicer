import { getTranslations } from "next-intl/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import SiteSettings, { DEFAULT_SETTINGS } from "@/lib/models/SiteSettings";
import HomeClient from "@/components/HomeClient";

async function getLatestPosts() {
    try {
        await dbConnect();
        const posts = await Post.find({ published: true, approvalStatus: 'approved' })
            .select('title titleKu titleAr category imageUrl author createdAt')
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();
        return JSON.parse(JSON.stringify(posts));
    } catch {
        return [];
    }
}

async function getSiteSettings() {
    try {
        await dbConnect();
        let settings = await SiteSettings.findOne({ key: 'main' }).lean();
        if (!settings) {
            const created = await SiteSettings.create(DEFAULT_SETTINGS);
            settings = created.toObject();
        }
        return JSON.parse(JSON.stringify(settings));
    } catch {
        return DEFAULT_SETTINGS;
    }
}

// Enable ISR: Revalidate every 60 seconds for better performance
export const revalidate = 60;

export default async function Home(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const t = await getTranslations("HomePage");
    const nav = await getTranslations("Navigation");
    const footer = await getTranslations("Footer");
    const common = await getTranslations("Common");
    const [posts, settings] = await Promise.all([getLatestPosts(), getSiteSettings()]);

    const translations = {
        title: t("title"),
        slogan: t("slogan"),
        description: t("description"),
        exploreButton: t("exploreButton"),
        joinButton: t("joinButton"),
        whatWeCover: t("whatWeCover"),
        whatWeCoverDesc: t("whatWeCoverDesc"),
        latestNews: t("latestNews"),
        latestNewsDesc: t("latestNewsDesc"),
        viewAllNews: t("viewAllNews"),
        readyToJoin: t("readyToJoin"),
        readyToJoinDesc: t("readyToJoinDesc"),
        createAccount: t("createAccount"),
        statFounded: t("stats.Founded"),
        statMembers: t("stats.Members"),
        statActivities: t("stats.Activities"),
        statLanguages: t("stats.Languages"),
        catTechTitle: t("categories.Technology.title"),
        catTechDesc: t("categories.Technology.desc"),
        catSciTitle: t("categories.Science.title"),
        catSciDesc: t("categories.Science.desc"),
        catSportsTitle: t("categories.Sports.title"),
        catSportsDesc: t("categories.Sports.desc"),
        catEntTitle: t("categories.Entertainment.title"),
        catEntDesc: t("categories.Entertainment.desc"),
        footerNicerClub: footer("nicerClub"),
        footerSlogan: footer("slogan"),
        footerQuickLinks: footer("quickLinks"),
        footerContact: footer("contact"),
        navAbout: nav("about"),
        navNews: nav("news"),
        navActivities: nav("activities"),
        navContact: nav("contact"),
        copyright: common("copyright", { year: new Date().getFullYear().toString() }),
    };

    return <HomeClient posts={posts} translations={translations} settings={settings} locale={locale} />;
}
