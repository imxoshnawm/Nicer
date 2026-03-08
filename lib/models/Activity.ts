import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    title: string;
    titleKu: string;
    titleAr: string;
    description: string;
    descriptionKu: string;
    descriptionAr: string;
    date: Date;
    location: string;
    imageUrl: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
    title: { type: String, required: true },
    titleKu: { type: String, default: '' },
    titleAr: { type: String, default: '' },
    description: { type: String, required: true },
    descriptionKu: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    date: { type: Date, required: true },
    location: { type: String, default: '' },
    imageUrl: { type: String, default: '', maxlength: 2048 },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming',
    },
}, {
    timestamps: true,
});

// Performance: Add indexes for faster queries
ActivitySchema.index({ status: 1, date: -1 });
ActivitySchema.index({ date: -1 });

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
