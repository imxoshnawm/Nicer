import mongoose, { Schema, Document } from 'mongoose';

export interface IAIKnowledge extends Document {
    title: string;
    content: string;
    category: 'general' | 'faq' | 'rules' | 'events' | 'custom';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AIKnowledgeSchema = new Schema<IAIKnowledge>({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10000,
    },
    category: {
        type: String,
        enum: ['general', 'faq', 'rules', 'events', 'custom'],
        default: 'general',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

AIKnowledgeSchema.index({ category: 1 });
AIKnowledgeSchema.index({ isActive: 1 });

export default mongoose.models.AIKnowledge || mongoose.model<IAIKnowledge>('AIKnowledge', AIKnowledgeSchema);
