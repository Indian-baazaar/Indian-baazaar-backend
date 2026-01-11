import express from 'express';
import { getNotifications, markAsRead, createNotification } from '../../controllers/Notification/notification.controller.js';
import auth from '../../middlewares/auth.js';
import { endpointSecurity } from '../../middlewares/endpointSecurity.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), markAsRead);
router.post('/create', auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createNotification); 

export default router;
