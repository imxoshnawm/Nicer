import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
    title: string;
    titleKu: string;
    titleAr: string;
    content: string;
    contentKu: string;
    contentAr: string;
    category: 'tech' | 'science' | 'sports' | 'entertainment' | 'other';
    imageUrl: string;
    author: string;
    published: boolean;
    // Approval system
    approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
    approvals: { userId: string; userName: string; date: Date }[];
    rejectionReason: string;
    requiredApprovals: number;
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema = new Schema<IPost>({
    title: { type: String, required: true },
    titleKu: { type: String, default: '' },
    titleAr: { type: String, default: '' },
    content: { type: String, required: true },
    contentKu: { type: String, default: '' },
    contentAr: { type: String, default: '' },
    category: {
        type: String,
        enum: ['tech', 'science', 'sports', 'entertainment', 'other'],
        required: true,
    },
    imageUrl: { type: String, default: '' },
    author: { type: String, required: true },
    published: { type: Boolean, default: false },
    // Approval
    approvalStatus: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected'],
        default: 'draft',
    },
    approvals: [{
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        date: { type: Date, default: Date.now },
    }],
    rejectionReason: { type: String, default: '' },
    requiredApprovals: { type: Number, default: 1 },
}, {
    timestamps: true,
});

// Performance: Add indexes for faster queries
PostSchema.index({ published: 1, approvalStatus: 1, createdAt: -1 });
PostSchema.index({ category: 1, published: 1 });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
