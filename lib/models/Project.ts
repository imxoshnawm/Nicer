import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectMember {
    user: mongoose.Types.ObjectId;
    role: string; // e.g. "Team Leader", "Developer", "Designer"
}

export interface IProject extends Document {
    title: string;
    description: string;
    images: string[]; // array of image URLs
    members: IProjectMember[];
    link?: string; // project URL (optional)
    videoUrl?: string; // YouTube or Google Drive link (optional)
    createdBy: mongoose.Types.ObjectId;
    status: 'published' | 'draft' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const ProjectMemberSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, trim: true, maxlength: 100 },
}, { _id: false });

const ProjectSchema = new Schema<IProject>({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 5000,
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: (v: string[]) => v.length <= 10,
            message: 'Maximum 10 images allowed.',
        },
    },
    members: {
        type: [ProjectMemberSchema],
        required: true,
        validate: {
            validator: (v: IProjectMember[]) => v.length > 0,
            message: 'At least one member is required.',
        },
    },
    link: { type: String, default: '', trim: true, maxlength: 2048 },
    videoUrl: { type: String, default: '', trim: true, maxlength: 2048 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['published', 'draft', 'rejected'],
        default: 'published',
    },
}, {
    timestamps: true,
});

// Indexes
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ 'members.user': 1 });
ProjectSchema.index({ status: 1 });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
