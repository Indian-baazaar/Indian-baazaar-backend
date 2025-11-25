import express from 'express';
import { getNotifications, markAsRead, createNotification } from '../controllers/notification.controller.js';
import auth from '../middlewares/auth.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, endpointSecurity({ maxRequests: 20, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), markAsRead);
router.post('/create', auth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createNotification); 

export default router;
