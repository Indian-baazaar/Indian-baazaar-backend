import { body, param, query } from 'express-validator';

export const validateCreateMessage = [
    body('receiverId')
        .notEmpty()
        .withMessage('Receiver ID is required')
        .isMongoId()
        .withMessage('Invalid receiver ID format'),
    
    body('receiverType')
        .notEmpty()
        .withMessage('Receiver type is required')
        .isIn(['User', 'SellerModel', 'SuperAdmin'])
        .withMessage('Invalid receiver type. Must be User, SellerModel, or SuperAdmin'),
    
    body('subject')
        .notEmpty()
        .withMessage('Subject is required')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Subject must be between 1 and 200 characters'),
    
    body('content')
        .notEmpty()
        .withMessage('Message content is required')
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message content must be between 1 and 2000 characters'),
    
    body('orderId')
        .optional()
        .isMongoId()
        .withMessage('Invalid order ID format'),
    
    body('messageType')
        .optional()
        .isIn(['GENERAL', 'ORDER_RELATED', 'SUPPORT', 'COMPLAINT'])
        .withMessage('Invalid message type'),
    
    body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Invalid priority level'),
    
    body('parentMessageId')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent message ID format'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
        .custom((tags) => {
            if (tags && tags.length > 10) {
                throw new Error('Maximum 10 tags allowed');
            }
            if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
                throw new Error('Each tag must be a string with maximum 50 characters');
            }
            return true;
        })
];

export const validateMessageId = [
    param('messageId')
        .isMongoId()
        .withMessage('Invalid message ID format')
];

// Validation for conversation parameters
export const validateConversationParams = [
    param('otherUserId')
        .isMongoId()
        .withMessage('Invalid other user ID format'),
    
    param('otherUserType')
        .isIn(['User', 'SellerModel', 'SuperAdmin'])
        .withMessage('Invalid other user type. Must be User, SellerModel, or SuperAdmin')
];

// Validation for query parameters
export const validateMessageQuery = [
    query('type')
        .optional()
        .isIn(['inbox', 'outbox', 'all'])
        .withMessage('Invalid type. Must be inbox, outbox, or all'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('status')
        .optional()
        .isIn(['SENT', 'DELIVERED', 'READ', 'ARCHIVED'])
        .withMessage('Invalid status'),
    
    query('messageType')
        .optional()
        .isIn(['GENERAL', 'ORDER_RELATED', 'SUPPORT', 'COMPLAINT'])
        .withMessage('Invalid message type'),
    
    query('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Invalid priority level'),
    
    query('orderId')
        .optional()
        .isMongoId()
        .withMessage('Invalid order ID format'),
    
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters')
];

export const validateConversationQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('orderId')
        .optional()
        .isMongoId()
        .withMessage('Invalid order ID format')
];