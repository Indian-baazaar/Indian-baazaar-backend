# Messaging System API Documentation

## Overview

The messaging system enables communication between different user types in the e-commerce platform:
- **Super Admin**: Can send messages to sellers and users
- **Sellers**: Can send messages to super admin and users (for order-related communication)
- **Users**: Can send messages to super admin only

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Base URL
```
/api/message
```

## Endpoints

### 1. Send Message
**POST** `/send`

Send a new message to another user.

#### Request Body
```json
{
  "receiverId": "string (required)",
  "receiverType": "User|SellerModel|SuperAdmin (required)",
  "subject": "string (required, max 200 chars)",
  "content": "string (required, max 2000 chars)",
  "orderId": "string (optional)",
  "messageType": "GENERAL|ORDER_RELATED|SUPPORT|COMPLAINT (optional, default: GENERAL)",
  "priority": "LOW|MEDIUM|HIGH|URGENT (optional, default: MEDIUM)",
  "parentMessageId": "string (optional, for replies)",
  "tags": ["string"] // optional, max 10 tags, each max 50 chars
}
```

#### Response
```json
{
  "success": true,
  "error": false,
  "message": "Message sent successfully",
  "data": {
    "_id": "message_id",
    "sender": {
      "id": {
        "_id": "sender_id",
        "name": "Sender Name",
        "email": "sender@email.com",
        "avatar": "avatar_url"
      },
      "type": "User"
    },
    "receiver": {
      "id": {
        "_id": "receiver_id",
        "name": "Receiver Name",
        "email": "receiver@email.com",
        "avatar": "avatar_url"
      },
      "type": "SellerModel"
    },
    "subject": "Message Subject",
    "content": "Message content",
    "orderId": "order_id",
    "messageType": "ORDER_RELATED",
    "priority": "MEDIUM",
    "status": "SENT",
    "isReply": false,
    "tags": ["tag1", "tag2"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get Messages
**GET** `/list`

Retrieve messages for the authenticated user with filtering and pagination.

#### Query Parameters
- `type` (optional): `inbox|outbox|all` (default: `inbox`)
- `page` (optional): Page number (min: 1, default: 1)
- `limit` (optional): Items per page (1-100, default: 20)
- `status` (optional): `SENT|DELIVERED|READ|ARCHIVED`
- `messageType` (optional): `GENERAL|ORDER_RELATED|SUPPORT|COMPLAINT`
- `priority` (optional): `LOW|MEDIUM|HIGH|URGENT`
- `orderId` (optional): Filter by order ID
- `search` (optional): Search in subject/content (1-100 chars)

#### Response
```json
{
  "success": true,
  "error": false,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "sender": { /* sender details */ },
        "receiver": { /* receiver details */ },
        "subject": "Message Subject",
        "content": "Message content",
        "status": "READ",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalMessages": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3. Get Message by ID
**GET** `/:messageId`

Retrieve a specific message by its ID. Only sender or receiver can access the message.

#### Response
```json
{
  "success": true,
  "error": false,
  "message": "Message retrieved successfully",
  "data": {
    "_id": "message_id",
    "sender": { /* populated sender details */ },
    "receiver": { /* populated receiver details */ },
    "subject": "Message Subject",
    "content": "Message content",
    "orderId": { /* populated order details */ },
    "messageType": "ORDER_RELATED",
    "priority": "HIGH",
    "status": "READ",
    "readAt": "2024-01-01T01:00:00.000Z",
    "parentMessageId": { /* parent message if reply */ },
    "isReply": true,
    "tags": ["urgent", "order"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

### 4. Get Conversation
**GET** `/conversation/:otherUserId/:otherUserType`

Get conversation history between authenticated user and another user.

#### Path Parameters
- `otherUserId`: ID of the other user
- `otherUserType`: Type of other user (`User|SellerModel|SuperAdmin`)

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `orderId` (optional): Filter by specific order

#### Response
```json
{
  "success": true,
  "error": false,
  "message": "Conversation retrieved successfully",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "sender": { /* sender details */ },
        "receiver": { /* receiver details */ },
        "subject": "Re: Order Issue",
        "content": "Thank you for your response...",
        "orderId": { /* order details */ },
        "status": "READ",
        "createdAt": "2024-01-01T02:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalMessages": 45,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 5. Mark Message as Read
**PUT** `/:messageId/read`

Mark a message as read. Only the receiver can mark messages as read.

#### Response
```json
{
  "success": true,
  "error": false,
  "message": "Message marked as read successfully",
  "data": {
    "_id": "message_id",
    "status": "READ",
    "readAt": "2024-01-01T03:00:00.000Z"
  }
}
```

### 6. Get Message Statistics
**GET** `/stats`

Get message statistics for the authenticated user.

#### Response
```json
{
  "success": true,
  "error": false,
  "message": "Message statistics retrieved successfully",
  "data": {
    "total": 150,
    "unread": 25,
    "read": 120,
    "archived": 5
  }
}
```

### 7. Delete Message
**DELETE** `/:messageId`

Archive a message (soft delete). Both sender and receiver can archive messages.

#### Response
```json
{
  "success": true,
  "error": false,
  "message": "Message archived successfully"
}
```

## Message Permissions

### Super Admin
- Can send messages to any user or seller
- Can receive messages from any user or seller
- Has full access to all messaging features

### Seller
- Can send messages to super admin
- Can send messages to users only for order-related communication
- Can receive messages from super admin and users

### User
- Can send messages to super admin only
- Can receive messages from super admin and sellers
- Cannot directly message other users

## Message Types

- **GENERAL**: General communication
- **ORDER_RELATED**: Messages related to specific orders
- **SUPPORT**: Support requests
- **COMPLAINT**: Complaints or issues

## Priority Levels

- **LOW**: Non-urgent messages
- **MEDIUM**: Standard priority (default)
- **HIGH**: Important messages
- **URGENT**: Critical messages requiring immediate attention

## Message Status

- **SENT**: Message has been sent
- **DELIVERED**: Message has been delivered
- **READ**: Message has been read by recipient
- **ARCHIVED**: Message has been archived (soft deleted)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": true,
  "message": "Error description",
  "details": "Additional error details (in development mode)"
}
```

### Common Error Codes

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource not found)
- **500**: Internal Server Error

## Usage Examples

### Example 1: User sends message to Super Admin
```javascript
// POST /api/message/send
{
  "receiverId": "super_admin_id",
  "receiverType": "SuperAdmin",
  "subject": "Account Issue",
  "content": "I'm having trouble accessing my account...",
  "messageType": "SUPPORT",
  "priority": "HIGH"
}
```

### Example 2: Seller sends order-related message to User
```javascript
// POST /api/message/send
{
  "receiverId": "user_id",
  "receiverType": "User",
  "subject": "Order Update",
  "content": "Your order has been shipped...",
  "orderId": "order_id",
  "messageType": "ORDER_RELATED",
  "priority": "MEDIUM"
}
```

### Example 3: Super Admin broadcasts to Seller
```javascript
// POST /api/message/send
{
  "receiverId": "seller_id",
  "receiverType": "SellerModel",
  "subject": "Policy Update",
  "content": "Please review the updated seller policies...",
  "messageType": "GENERAL",
  "priority": "HIGH",
  "tags": ["policy", "important"]
}
```

## Rate Limiting

The messaging system is subject to the global rate limiting configured in the application (500 requests per minute per IP).

## Security Features

- JWT-based authentication
- Input validation and sanitization
- XSS protection
- SQL injection prevention
- Permission-based access control
- Audit trail for all messages