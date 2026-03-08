import mongoose, { Schema, Document } from 'mongoose';

// All available roles in the system
export const AVAILABLE_ROLES = [
    'admin',           // Full system administrator
    'president',       // Club president
    'vice_president',  // Vice president
    'secretary',       // Club secretary
    'treasurer',       // Financial manager
    'media',           // Media & PR team
    'editor',          // Content editor
    'designer',        // Design team
    'developer',       // Tech/Dev team
    'coordinator',     // Event coordinator
    'member',          // Regular member (replaces student)
] as const;

export type UserRole = typeof AVAILABLE_ROLES[number];

// Roles that have admin panel access
export const ADMIN_PANEL_ROLES: UserRole[] = [
    'admin', 'president', 'vice_president', 'secretary',
    'treasurer', 'media', 'editor', 'designer', 'developer', 'coordinator',
];

// Role display labels
export const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Admin',
    president: 'President',
    vice_president: 'Vice President',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    media: 'Media',
    editor: 'Editor',
    designer: 'Designer',
    developer: 'Developer',
    coordinator: 'Coordinator',
    member: 'Member',
};

// Role colors for UI display
export const ROLE_COLORS: Record<UserRole, string> = {
    admin: 'bg-red-500/15 text-red-400',
    president: 'bg-yellow-500/15 text-yellow-400',
    vice_president: 'bg-amber-500/15 text-amber-400',
    secretary: 'bg-indigo-500/15 text-indigo-400',
    treasurer: 'bg-emerald-500/15 text-emerald-400',
    media: 'bg-pink-500/15 text-pink-400',
    editor: 'bg-blue-500/15 text-blue-400',
    designer: 'bg-purple-500/15 text-purple-400',
    developer: 'bg-cyan-500/15 text-cyan-400',
    coordinator: 'bg-orange-500/15 text-orange-400',
    member: 'bg-green-500/15 text-green-400',
};

// Helper: check if a user's roles include any of the allowed roles
export function hasAnyRole(userRoles: string[], allowedRoles: string[]): boolean {
    return allowedRoles.some(r => userRoles.includes(r));
}

// Helper: check if user has admin panel access
export function canAccessAdminPanel(roles: string[]): boolean {
    return hasAnyRole(roles, ADMIN_PANEL_ROLES);
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    roles: string[];
    memberId: string;
    department?: string;
    avatar?: string;
    bio?: string;
    displayOrder: number;
    blocked: boolean;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'],
        maxlength: 254,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    roles: {
        type: [String],
        default: ['member'],
        validate: {
            validator: (v: string[]) => v.length > 0 && v.length <= 20,
            message: 'User must have at least one role.',
        },
    },
    memberId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        maxlength: 20,
    },
    department: { type: String, default: '', trim: true, maxlength: 100 },
    avatar: { type: String, default: '', maxlength: 2048 },
    bio: { type: String, default: 'Member of NICER', trim: true, maxlength: 500 },
    displayOrder: { type: Number, default: 999 },
    blocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

// SECURITY: Never return password in JSON serialization
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// SECURITY: Add index for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ memberId: 1 });

// Generate unique member ID
export function generateMemberId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const prefix = 'NC';
    let id = '';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${id}`;
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
