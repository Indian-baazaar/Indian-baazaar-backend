import NotificationModel from '../models/notification.model.js';
import UserModel from '../models/user.model.js';


export async function createNotificationForAllUsers(product) {
  try {
    const users = await UserModel.find({}, '_id').lean();
    if (!users || users.length === 0) return;

    const docs = users.map((u) => ({
      user: u._id,
      product: product._id,
      title: `New product: ${product.name}`,
      message: `${product.name} is now available.`,
      read: false,
    }));

    await NotificationModel.insertMany(docs);
  } catch (error) {
    console.error('Failed to create notifications for users:', error);
    return  error.message || error || 'Error creating notifications';
  }
}
