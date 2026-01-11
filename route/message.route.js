import express from 'express';
import {
    createMessage,
    getMessages,
    getMessageById,
    getConversation,
    markMessageAsRead,
    getMessageStats,
    deleteMessage
} from '../controllers/Messages/message.controller.js';
import {
    validateCreateMessage,
    validateMessageId,
    validateConversationParams,
    validateMessageQuery,
    validateConversationQuery
} from '../Validator/message.validator.js';
import { messageAuth } from '../middlewares/messageAuth.js';
import sellerAuth from '../middlewares/sellerAuth.js';

const messageRouter = express.Router();

messageRouter.use(messageAuth);

messageRouter.post('/send', validateCreateMessage, sellerAuth, createMessage);

messageRouter.get('/list', validateMessageQuery, sellerAuth, getMessages);

messageRouter.get('/stats', getMessageStats);

messageRouter.get('/conversation/:otherUserId/:otherUserType', validateConversationParams, validateConversationQuery, sellerAuth, getConversation);

messageRouter.get('/:messageId', validateMessageId, sellerAuth, getMessageById);

messageRouter.put('/:messageId/read', validateMessageId, sellerAuth, markMessageAsRead);

messageRouter.delete('/:messageId', validateMessageId, sellerAuth, deleteMessage);

export default messageRouter;