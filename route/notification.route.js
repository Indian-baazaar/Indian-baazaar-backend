import express from 'express';
import { getNotifications, markAsRead, createNotification } from '../controllers/notification.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, markAsRead);
router.post('/create', auth, createNotification); 

export default router;
