# E-commerce Messaging System

A comprehensive messaging system for the e-commerce platform that enables secure communication between Super Admins, Sellers, and Users with proper permission controls and message management features.

## 🚀 Features

### Core Functionality
- **Multi-user messaging** between Super Admins, Sellers, and Users
- **Permission-based communication** with role-specific restrictions
- **Order-related messaging** for customer support
- **Message threading** with reply functionality
- **Message status tracking** (sent, delivered, read, archived)
- **Search and filtering** capabilities
- **Pagination** for efficient data loading
- **Message statistics** and analytics

### Security Features
- **JWT-based authentication** for all endpoints
- **Role-based access control** with strict permission validation
- **Input validation and sanitization** to prevent XSS and injection attacks
- **Rate limiting** to prevent spam and abuse
- **Audit trail** for all message activities

### User Permissions

| User Type | Can Send To | Can Receive From | Special Permissions |
|-----------|-------------|------------------|-------------------|
| **Super Admin** | Anyone | Anyone | Full access to all messages |
| **Seller** | Super Admin, Users (order-related) | Super Admin, Users | Can message users only for orders |
| **User** | Super Admin only | Super Admin, Sellers | Limited to support communication |

## 📁 File Structure

```
├── models/
│   └── message.model.js          # Message data model with schema
├── controllers/
│   └── message.controller.js     # Message business logic and API handlers
├── middlewares/
│   └── messageAuth.js           # Authentication middleware for messaging
├── Validator/
│   └── message.validator.js     # Input validation rules
├── route/
│   └── message.route.js         # API route definitions
├── docs/
│   └── MESSAGE_API.md           # Comprehensive API documentation
├── examples/
│   ├── message-api-examples.js  # Usage examples and code samples
│   └── test-message-api.js      # Basic API testing script
└── README_MESSAGING.md          # This file
```

## 🛠 Installation & Setup

### 1. Dependencies
The messaging system uses existing project dependencies:
- `mongoose` - MongoDB object modeling
- `express-validator` - Input validation
- `jsonwebtoken` - JWT authentication
- `express` - Web framework

### 2. Database Setup
The system automatically creates the necessary MongoDB collections and indexes when first used.

### 3. Environment Variables
Ensure these environment variables are set in your `.env` file:
```env
SECRET_KEY_ACCESS_TOKEN=your_jwt_secret_key
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

### 4. Start the Server
```bash
npm start
# or for development
npm run dev
```

## 📚 API Usage

### Base URL
```
http://localhost:3000/api/message
```

### Authentication
All endpoints require a JWT token in the Authorization header:
```javascript
headers: {
  'Authorization': 'Bearer your_jwt_token'
}
```

### Quick Start Examples

#### 1. Send a Message
```javascript
POST /api/message/send
{
  "receiverId": "user_id_here",
  "receiverType": "User",
  "subject": "Order Update",
  "content": "Your order has been shipped!",
  "messageType": "ORDER_RELATED",
  "priority": "MEDIUM"
}
```

#### 2. Get Inbox Messages
```javascript
GET /api/message/list?type=inbox&page=1&limit=20
```

#### 3. Get Conversation
```javascript
GET /api/message/conversation/other_user_id/User?page=1&limit=50
```

#### 4. Mark Message as Read
```javascript
PUT /api/message/message_id/read
```

## 🔧 Configuration

### Message Types
- `GENERAL` - General communication
- `ORDER_RELATED` - Order-specific messages
- `SUPPORT` - Support requests
- `COMPLAINT` - Complaints and issues

### Priority Levels
- `LOW` - Non-urgent messages
- `MEDIUM` - Standard priority (default)
- `HIGH` - Important messages
- `URGENT` - Critical messages

### Message Status
- `SENT` - Message sent successfully
- `DELIVERED` - Message delivered to recipient
- `READ` - Message read by recipient
- `ARCHIVED` - Message archived (soft deleted)

## 🧪 Testing

### Run Basic Tests
```bash
node examples/test-message-api.js
```

### Manual Testing
1. Start the server
2. Create test users with different roles
3. Use the examples in `examples/message-api-examples.js`
4. Test various messaging scenarios

### Test Scenarios
- ✅ User sends support message to Super Admin
- ✅ Seller sends order update to User
- ✅ Super Admin broadcasts to Sellers
- ✅ Message threading and replies
- ✅ Permission validation
- ✅ Search and filtering
- ✅ Pagination

## 🔒 Security Considerations

### Input Validation
- All inputs are validated using `express-validator`
- Message content limited to 2000 characters
- Subject limited to 200 characters
- Tags limited to 10 items, 50 characters each

### Permission Checks
- Users can only message Super Admins
- Sellers can message Super Admins and Users (order-related only)
- Super Admins can message anyone
- Order validation for seller-to-user messages

### Rate Limiting
- Global rate limiting applies (500 requests/minute/IP)
- Additional message-specific limits can be added

## 📊 Performance Features

### Database Optimization
- Indexed fields for fast queries
- Efficient pagination
- Optimized aggregation for statistics

### Caching Strategy
- Message statistics can be cached
- Conversation threads optimized for performance

### Scalability
- Designed for horizontal scaling
- Stateless architecture
- Efficient database queries

## 🚨 Error Handling

### Common Error Responses
```javascript
// 400 - Validation Error
{
  "success": false,
  "error": true,
  "message": "Validation failed",
  "details": [/* validation errors */]
}

// 403 - Permission Denied
{
  "success": false,
  "error": true,
  "message": "You do not have permission to send messages to this user"
}

// 404 - Not Found
{
  "success": false,
  "error": true,
  "message": "Message not found"
}
```

## 🔄 Future Enhancements

### Planned Features
- [ ] File attachments support
- [ ] Message templates
- [ ] Bulk messaging
- [ ] Message scheduling
- [ ] Advanced search with filters
- [ ] Message encryption
- [ ] Push notifications
- [ ] Message analytics dashboard

### Integration Possibilities
- Email notifications for new messages
- SMS alerts for urgent messages
- Integration with customer support systems
- Webhook support for external systems

## 📖 Documentation

- **API Documentation**: `docs/MESSAGE_API.md`
- **Code Examples**: `examples/message-api-examples.js`
- **Test Scripts**: `examples/test-message-api.js`

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add proper validation for new fields
3. Update documentation for API changes
4. Include tests for new functionality
5. Maintain backward compatibility

## 📞 Support

For questions or issues with the messaging system:
1. Check the API documentation in `docs/MESSAGE_API.md`
2. Review the examples in `examples/`
3. Test with the provided test scripts
4. Check server logs for detailed error information

---

**Note**: This messaging system is designed to be secure, scalable, and maintainable. It follows REST API best practices and includes comprehensive validation and error handling.