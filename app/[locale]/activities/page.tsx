import dbConnect from "@/lib/mongodb";
import Activity from "@/lib/models/Activity";
import { getTranslations } from "next-intl/server";
import ActivitiesClient from "@/components/ActivitiesClient";

// Enable ISR: Revalidate every 120 seconds (activities change less frequently)
export const revalidate = 120;

export default async function ActivitiesPage(
    props: {
        params: Promise<{ locale: string }>
    }
) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations("ActivitiesPage");

    await dbConnect();
    const activitiesData = await Activity.find()
        .select('title titleKu titleAr description descriptionKu descriptionAr date location imageUrl status')
        .sort({ date: 1 })
        .lean();
    const activities = JSON.parse(JSON.stringify(activitiesData));

    const translations = {
        title: t("title"),
        subtitle: t("subtitle"),
        noActivities: t("noActivities"),
        upcoming: t("upcoming"),
        ongoing: t("ongoing"),
        completed: t("completed"),
    };

    return <ActivitiesClient activities={activities} locale={locale} translations={translations} />;
}
