import mongoose, { Schema, Document } from 'mongoose';

export interface IStat {
    value: string;
    label: string;
    labelKu: string;
    labelAr: string;
}

export interface ICategory {
    name: string;
    nameKu: string;
    nameAr: string;
    icon: string;
    description: string;
    descriptionKu: string;
    descriptionAr: string;
    color: string;
}

export interface ISiteSettings extends Document {
    key: string; // always 'main'
    stats: IStat[];
    categories: ICategory[];
    coverTitle: string;
    coverTitleKu: string;
    coverTitleAr: string;
    coverSubtitle: string;
    coverSubtitleKu: string;
    coverSubtitleAr: string;
    updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
    key: { type: String, default: 'main', unique: true },
    stats: [{
        value: { type: String, required: true },
        label: { type: String, required: true },
        labelKu: { type: String, default: '' },
        labelAr: { type: String, default: '' },
    }],
    categories: [{
        name: { type: String, required: true },
        nameKu: { type: String, default: '' },
        nameAr: { type: String, default: '' },
        icon: { type: String, default: '📁' },
        description: { type: String, default: '' },
        descriptionKu: { type: String, default: '' },
        descriptionAr: { type: String, default: '' },
        color: { type: String, default: 'from-blue-500 to-cyan-500' },
    }],
    coverTitle: { type: String, default: 'What We Cover' },
    coverTitleKu: { type: String, default: 'چی لەخۆدەگرین' },
    coverTitleAr: { type: String, default: 'ما نغطيه' },
    coverSubtitle: { type: String, default: '' },
    coverSubtitleKu: { type: String, default: '' },
    coverSubtitleAr: { type: String, default: '' },
}, {
    timestamps: true,
});

// Default data seeder
export const DEFAULT_SETTINGS = {
    key: 'main',
    stats: [
        { value: '2024', label: 'Founded', labelKu: 'دامەزراوە', labelAr: 'تأسست' },
        { value: '100+', label: 'Members', labelKu: 'ئەندام', labelAr: 'أعضاء' },
        { value: '50+', label: 'Activities', labelKu: 'چالاکی', labelAr: 'أنشطة' },
        { value: '3', label: 'Languages', labelKu: 'زمان', labelAr: 'لغات' },
    ],
    categories: [
        { name: 'Technology', nameKu: 'تەکنەلۆژیا', nameAr: 'التكنولوجيا', icon: '💻', description: 'AI, gadgets, apps & future tech', descriptionKu: 'زیرەکی دەستکرد، ئاپ و تەکنەلۆژیای داهاتوو', descriptionAr: 'الذكاء الاصطناعي والتطبيقات', color: 'from-blue-500 to-cyan-500' },
        { name: 'Science', nameKu: 'زانست', nameAr: 'العلوم', icon: '🔬', description: 'Space, discoveries & facts', descriptionKu: 'ئاسمان، دۆزینەوە و ڕاستییەکان', descriptionAr: 'الفضاء والاكتشافات', color: 'from-green-500 to-emerald-500' },
        { name: 'Sports', nameKu: 'وەرزش', nameAr: 'الرياضة', icon: '⚽', description: 'Competitions & fitness', descriptionKu: 'پێشبڕکێ و تەندروستی', descriptionAr: 'المسابقات واللياقة', color: 'from-orange-500 to-amber-500' },
        { name: 'Entertainment', nameKu: 'چێژبینین', nameAr: 'الترفيه', icon: '🎬', description: 'Viral content & trends', descriptionKu: 'ناوەڕۆکی بەناوبانگ', descriptionAr: 'المحتوى الشائع', color: 'from-purple-500 to-pink-500' },
    ],
    coverTitle: 'What We Cover',
    coverTitleKu: 'چی لەخۆدەگرین',
    coverTitleAr: 'ما نغطيه',
    coverSubtitle: "Exploring a balanced mix of Technology, Science, Sports, and Entertainment to support every student's passion.",
    coverSubtitleKu: 'تێکەڵەیەکی هاوسەنگ لە تەکنەلۆژیا، زانست، وەرزش و چێژبینین بۆ پشتگیری هەموو خوێندکارێک.',
    coverSubtitleAr: 'استكشاف مزيج متوازن من التكنولوجيا والعلوم والرياضة والترفيه لدعم شغف كل طالب.',
};

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
