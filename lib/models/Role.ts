import mongoose, { Schema, Document } from 'mongoose';

// All available permissions in the system
export const ALL_PERMISSIONS = [
    // Dashboard
    'dashboard.view',

    // Posts
    'posts.view',
    'posts.create',
    'posts.edit',
    'posts.delete',
    'posts.publish',

    // Approvals
    'approvals.view',
    'approvals.manage',

    // Activities
    'activities.view',
    'activities.create',
    'activities.edit',
    'activities.delete',

    // Users
    'users.view',
    'users.edit',
    'users.delete',
    'users.manage_roles',

    // Members
    'members.view',
    'members.edit',

    // Projects
    'projects.view',
    'projects.manage',

    // Messages
    'messages.view',
    'messages.reply',

    // Settings
    'settings.view',
    'settings.edit',

    // Audit
    'audit.view',

    // Roles
    'roles.view',
    'roles.manage',

    // AI Knowledge
    'ai.view',
    'ai.manage',
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

// Permission group labels for UI
export const PERMISSION_GROUPS: Record<string, { label: string; labelKu: string; labelAr: string; permissions: Permission[] }> = {
    dashboard: {
        label: 'Dashboard',
        labelKu: 'داشبۆرد',
        labelAr: 'لوحة التحكم',
        permissions: ['dashboard.view'],
    },
    posts: {
        label: 'Posts',
        labelKu: 'بابەتەکان',
        labelAr: 'المنشورات',
        permissions: ['posts.view', 'posts.create', 'posts.edit', 'posts.delete', 'posts.publish'],
    },
    approvals: {
        label: 'Approvals',
        labelKu: 'پەسەندکردنەکان',
        labelAr: 'الموافقات',
        permissions: ['approvals.view', 'approvals.manage'],
    },
    activities: {
        label: 'Activities',
        labelKu: 'چالاکییەکان',
        labelAr: 'الأنشطة',
        permissions: ['activities.view', 'activities.create', 'activities.edit', 'activities.delete'],
    },
    users: {
        label: 'Users',
        labelKu: 'بەکارهێنەران',
        labelAr: 'المستخدمون',
        permissions: ['users.view', 'users.edit', 'users.delete', 'users.manage_roles'],
    },
    members: {
        label: 'Members',
        labelKu: 'ئەندامان',
        labelAr: 'الأعضاء',
        permissions: ['members.view', 'members.edit'],
    },
    projects: {
        label: 'Projects',
        labelKu: 'پڕۆژەکان',
        labelAr: 'المشاريع',
        permissions: ['projects.view', 'projects.manage'],
    },
    messages: {
        label: 'Messages',
        labelKu: 'نامەکان',
        labelAr: 'الرسائل',
        permissions: ['messages.view', 'messages.reply'],
    },
    settings: {
        label: 'Settings',
        labelKu: 'ڕێکخستنەکان',
        labelAr: 'الإعدادات',
        permissions: ['settings.view', 'settings.edit'],
    },
    audit: {
        label: 'Audit Log',
        labelKu: 'تۆماری چاودێری',
        labelAr: 'سجل التدقيق',
        permissions: ['audit.view'],
    },
    roles: {
        label: 'Roles',
        labelKu: 'ڕۆڵەکان',
        labelAr: 'الأدوار',
        permissions: ['roles.view', 'roles.manage'],
    },
    ai: {
        label: 'AI Knowledge',
        labelKu: 'زانیاری AI',
        labelAr: 'معرفة الذكاء الاصطناعي',
        permissions: ['ai.view', 'ai.manage'],
    },
};

// Permission labels for UI
export const PERMISSION_LABELS: Record<string, { en: string; ku: string; ar: string }> = {
    'dashboard.view': { en: 'View Dashboard', ku: 'بینینی داشبۆرد', ar: 'عرض لوحة التحكم' },
    'posts.view': { en: 'View Posts', ku: 'بینینی بابەتەکان', ar: 'عرض المنشورات' },
    'posts.create': { en: 'Create Posts', ku: 'دروستکردنی بابەت', ar: 'إنشاء منشور' },
    'posts.edit': { en: 'Edit Posts', ku: 'دەستکاری بابەت', ar: 'تعديل المنشورات' },
    'posts.delete': { en: 'Delete Posts', ku: 'سڕینەوەی بابەت', ar: 'حذف المنشورات' },
    'posts.publish': { en: 'Publish Posts', ku: 'بڵاوکردنەوەی بابەت', ar: 'نشر المنشورات' },
    'approvals.view': { en: 'View Approvals', ku: 'بینینی پەسەندکردنەکان', ar: 'عرض الموافقات' },
    'approvals.manage': { en: 'Manage Approvals', ku: 'بەڕێوەبردنی پەسەندکردنەکان', ar: 'إدارة الموافقات' },
    'activities.view': { en: 'View Activities', ku: 'بینینی چالاکییەکان', ar: 'عرض الأنشطة' },
    'activities.create': { en: 'Create Activities', ku: 'دروستکردنی چالاکی', ar: 'إنشاء نشاط' },
    'activities.edit': { en: 'Edit Activities', ku: 'دەستکاری چالاکی', ar: 'تعديل الأنشطة' },
    'activities.delete': { en: 'Delete Activities', ku: 'سڕینەوەی چالاکی', ar: 'حذف الأنشطة' },
    'users.view': { en: 'View Users', ku: 'بینینی بەکارهێنەران', ar: 'عرض المستخدمين' },
    'users.edit': { en: 'Edit Users', ku: 'دەستکاری بەکارهێنەر', ar: 'تعديل المستخدمين' },
    'users.delete': { en: 'Delete Users', ku: 'سڕینەوەی بەکارهێنەر', ar: 'حذف المستخدمين' },
    'users.manage_roles': { en: 'Manage User Roles', ku: 'بەڕێوەبردنی ڕۆڵی بەکارهێنەران', ar: 'إدارة أدوار المستخدمين' },
    'members.view': { en: 'View Members', ku: 'بینینی ئەندامان', ar: 'عرض الأعضاء' },
    'members.edit': { en: 'Edit Members', ku: 'دەستکاری ئەندام', ar: 'تعديل الأعضاء' },
    'projects.view': { en: 'View Projects', ku: 'بینینی پڕۆژەکان', ar: 'عرض المشاريع' },
    'projects.manage': { en: 'Manage Projects', ku: 'بەڕێوەبردنی پڕۆژەکان', ar: 'إدارة المشاريع' },
    'messages.view': { en: 'View Messages', ku: 'بینینی نامەکان', ar: 'عرض الرسائل' },
    'messages.reply': { en: 'Reply to Messages', ku: 'وەڵامدانەوەی نامەکان', ar: 'الرد على الرسائل' },
    'settings.view': { en: 'View Settings', ku: 'بینینی ڕێکخستنەکان', ar: 'عرض الإعدادات' },
    'settings.edit': { en: 'Edit Settings', ku: 'دەستکاری ڕێکخستنەکان', ar: 'تعديل الإعدادات' },
    'audit.view': { en: 'View Audit Log', ku: 'بینینی تۆماری چاودێری', ar: 'عرض سجل التدقيق' },
    'roles.view': { en: 'View Roles', ku: 'بینینی ڕۆڵەکان', ar: 'عرض الأدوار' },
    'roles.manage': { en: 'Manage Roles', ku: 'بەڕێوەبردنی ڕۆڵەکان', ar: 'إدارة الأدوار' },
    'ai.view': { en: 'View AI Knowledge', ku: 'بینینی زانیاری AI', ar: 'عرض معرفة الذكاء الاصطناعي' },
    'ai.manage': { en: 'Manage AI Knowledge', ku: 'بەڕێوەبردنی زانیاری AI', ar: 'إدارة معرفة الذكاء الاصطناعي' },
};

export interface IRole extends Document {
    name: string;
    slug: string;
    description?: string;
    permissions: string[];
    isSystem: boolean;  // system roles (admin, member) cannot be deleted
    color: string;
    icon: string;
    createdAt: Date;
    updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 50,
    },
    description: {
        type: String,
        default: '',
        trim: true,
        maxlength: 200,
    },
    permissions: {
        type: [String],
        default: [],
    },
    isSystem: {
        type: Boolean,
        default: false,
    },
    color: {
        type: String,
        default: 'blue',
        trim: true,
    },
    icon: {
        type: String,
        default: '👤',
        trim: true,
    },
}, {
    timestamps: true,
});

RoleSchema.index({ slug: 1 });

// Default system roles with all permissions for admin
export const SYSTEM_ROLES = [
    {
        name: 'Admin',
        slug: 'admin',
        description: 'Full system administrator with all permissions',
        permissions: [...ALL_PERMISSIONS],
        isSystem: true,
        color: 'red',
        icon: '👑',
    },
    {
        name: 'Member',
        slug: 'member',
        description: 'Regular member with no admin permissions',
        permissions: [],
        isSystem: true,
        color: 'green',
        icon: '👤',
    },
];

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
