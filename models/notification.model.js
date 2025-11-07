import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String },
    message: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel;
