import NotificationModel from '../models/notification.model.js';

export async function getNotifications(request, response) {
  try {
    const userId = request.userId;
    const notifications = await NotificationModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('product', 'name price images');

    return response.status(200).json({ error: false, success: true, notifications });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function markAsRead(request, response) {
  try {
    const userId = request.userId;
    const notifId = request.params.id;

    const notif = await NotificationModel.findOne({ _id: notifId, user: userId });
    if (!notif) {
      return response.status(404).json({ message: 'Notification not found', error: true, success: false });
    }

    if (notif.read) {
      return response.status(200).json({ message: 'Already marked as read', error: false, success: true });
    }

    notif.read = true;
    await notif.save();

    return response.status(200).json({ message: 'Notification marked as read', error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}
