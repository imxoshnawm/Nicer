import dbConnect from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import { getTranslations } from "next-intl/server";
import NewsClient from "@/components/NewsClient";

// Enable ISR: Revalidate every 60 seconds
export const revalidate = 60;

export default async function NewsPage(
    props: {
        params: Promise<{ locale: string }>
    }
) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations("NewsPage");

    await dbConnect();
    const postsResult = await Post.find({ published: true, approvalStatus: 'approved' })
        .select('title titleKu titleAr content contentKu contentAr category imageUrl author createdAt')
        .sort({ createdAt: -1 })
        .populate("author", "name")
        .lean();
    const posts = JSON.parse(JSON.stringify(postsResult)) || [];

    const translations = {
        title: t("title"),
        subtitle: t("subtitle"),
        noPosts: t("noPosts"),
        all: t("all"),
        tech: t("tech"),
        science: t("science"),
        sports: t("sports"),
        entertainment: t("entertainment"),
        other: t("other"),
    };

    return <NewsClient posts={posts} locale={locale} translations={translations} />;
}
