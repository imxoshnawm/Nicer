import mongoose, { Schema } from 'mongoose';

// ============================================================
// Audit Log Model - Tracks all sensitive admin actions
// ============================================================

const AuditLogSchema = new Schema({
    // Action type: 'user.update', 'post.delete', 'settings.update', 'auth.login', etc.
    action: {
        type: String,
        required: true,
        index: true,
    },

    // Who performed the action
    actor: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
    },

    // What was affected
    target: {
        type: { type: String }, // 'user', 'post', 'activity', 'settings', 'message'
        id: { type: String },
        name: { type: String },
    },

    // Additional details/context
    details: {
        type: Schema.Types.Mixed,
        default: {},
    },

    // Security context
    ip: { type: String },
    userAgent: { type: String },

    // Severity level
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info',
    },

    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Compound index for querying by actor
AuditLogSchema.index({ 'actor.id': 1, timestamp: -1 });
// Compound index for querying by action type
AuditLogSchema.index({ action: 1, timestamp: -1 });
// Auto-delete logs after 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
