import express from 'express';
import {
    createMessage,
    getMessages,
    getMessageById,
    getConversation,
    markMessageAsRead,
    getMessageStats,
    deleteMessage
} from '../controllers/message.controller.js';
import {
    validateCreateMessage,
    validateMessageId,
    validateConversationParams,
    validateMessageQuery,
    validateConversationQuery
} from '../Validator/message.validator.js';
import { messageAuth } from '../middlewares/messageAuth.js';

const messageRouter = express.Router();

messageRouter.use(messageAuth);

messageRouter.post('/send', validateCreateMessage, createMessage);

messageRouter.get('/list', validateMessageQuery, getMessages);

messageRouter.get('/stats', getMessageStats);

messageRouter.get('/conversation/:otherUserId/:otherUserType', 
    validateConversationParams, 
    validateConversationQuery, 
    getConversation
);

messageRouter.get('/:messageId', validateMessageId, getMessageById);

messageRouter.put('/:messageId/read', validateMessageId, markMessageAsRead);

messageRouter.delete('/:messageId', validateMessageId, deleteMessage);

export default messageRouter;