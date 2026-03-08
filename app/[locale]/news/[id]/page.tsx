import dbConnect from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import PostDetailClient from "@/components/PostDetailClient";
import mongoose from "mongoose";

export default async function PostDetailPage(
    props: {
        params: Promise<{ locale: string; id: string }>
    }
) {
    const params = await props.params;
    const { locale, id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        notFound();
    }

    const t = await getTranslations("PostDetail");

    await dbConnect();
    const postResult = await Post.findById(id).lean();

    if (!postResult || !(postResult as any).published || (postResult as any).approvalStatus !== 'approved') {
        notFound();
    }

    const post = JSON.parse(JSON.stringify(postResult));

    const translations = {
        backToNews: t("backToNews"),
        by: t("by"),
        category: t("category"),
        publishedOn: t("publishedOn"),
        sharePost: t("sharePost"),
    };

    return <PostDetailClient post={post} locale={locale} translations={translations} />;
}
