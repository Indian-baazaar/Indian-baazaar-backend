// Message API Usage Examples
// These examples demonstrate how to use the messaging system API

const API_BASE_URL = 'http://localhost:3000/api/message';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method,
        headers,
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Example 1: User sends support message to Super Admin
async function userSendsSupport(userToken) {
    const messageData = {
        receiverId: "super_admin_user_id", // Replace with actual super admin ID
        receiverType: "SuperAdmin",
        subject: "Account Login Issue",
        content: "I'm unable to log into my account. I keep getting an 'invalid credentials' error even though I'm sure my password is correct. Can you please help me reset it?",
        messageType: "SUPPORT",
        priority: "HIGH",
        tags: ["login", "password", "urgent"]
    };
    
    try {
        const result = await apiCall('/send', 'POST', messageData, userToken);
        console.log('Support message sent:', result);
        return result.data._id; // Return message ID for further operations
    } catch (error) {
        console.error('Failed to send support message:', error);
    }
}

// Example 2: Seller sends order update to User
async function sellerSendsOrderUpdate(sellerToken) {
    const messageData = {
        receiverId: "customer_user_id", // Replace with actual customer ID
        receiverType: "User",
        subject: "Your Order #12345 Has Been Shipped",
        content: "Great news! Your order has been shipped and is on its way. Tracking number: TRK123456789. Expected delivery: 3-5 business days.",
        orderId: "order_object_id", // Replace with actual order ID
        messageType: "ORDER_RELATED",
        priority: "MEDIUM",
        tags: ["shipping", "tracking"]
    };
    
    try {
        const result = await apiCall('/send', 'POST', messageData, sellerToken);
        console.log('Order update sent:', result);
        return result.data._id;
    } catch (error) {
        console.error('Failed to send order update:', error);
    }
}

// Example 3: Super Admin sends policy update to Seller
async function superAdminSendsPolicyUpdate(adminToken) {
    const messageData = {
        receiverId: "seller_id", // Replace with actual seller ID
        receiverType: "SellerModel",
        subject: "Important: Updated Return Policy",
        content: "We've updated our return policy effective immediately. Please review the new guidelines in your seller dashboard and update your product listings accordingly. Key changes include extended return window and new condition requirements.",
        messageType: "GENERAL",
        priority: "HIGH",
        tags: ["policy", "returns", "mandatory"]
    };
    
    try {
        const result = await apiCall('/send', 'POST', messageData, adminToken);
        console.log('Policy update sent:', result);
        return result.data._id;
    } catch (error) {
        console.error('Failed to send policy update:', error);
    }
}

// Example 4: Get user's inbox with filtering
async function getUserInbox(userToken, filters = {}) {
    const queryParams = new URLSearchParams({
        type: 'inbox',
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.status && { status: filters.status }),
        ...(filters.messageType && { messageType: filters.messageType }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
    });
    
    try {
        const result = await apiCall(`/list?${queryParams}`, 'GET', null, userToken);
        console.log('Inbox messages:', result);
        return result.data;
    } catch (error) {
        console.error('Failed to get inbox:', error);
    }
}

// Example 5: Get conversation between user and seller
async function getConversation(userToken, otherUserId, otherUserType, orderId = null) {
    const queryParams = new URLSearchParams({
        page: 1,
        limit: 50,
        ...(orderId && { orderId })
    });
    
    try {
        const result = await apiCall(
            `/conversation/${otherUserId}/${otherUserType}?${queryParams}`, 
            'GET', 
            null, 
            userToken
        );
        console.log('Conversation:', result);
        return result.data;
    } catch (error) {
        console.error('Failed to get conversation:', error);
    }
}

// Example 6: Reply to a message
async function replyToMessage(userToken, parentMessageId, replyContent) {
    // First get the parent message to extract receiver info
    try {
        const parentMessage = await apiCall(`/${parentMessageId}`, 'GET', null, userToken);
        
        const replyData = {
            receiverId: parentMessage.data.sender.id._id,
            receiverType: parentMessage.data.sender.type,
            subject: `Re: ${parentMessage.data.subject}`,
            content: replyContent,
            parentMessageId: parentMessageId,
            messageType: parentMessage.data.messageType,
            priority: parentMessage.data.priority,
            ...(parentMessage.data.orderId && { orderId: parentMessage.data.orderId._id })
        };
        
        const result = await apiCall('/send', 'POST', replyData, userToken);
        console.log('Reply sent:', result);
        return result.data._id;
    } catch (error) {
        console.error('Failed to send reply:', error);
    }
}

// Example 7: Mark message as read
async function markMessageAsRead(userToken, messageId) {
    try {
        const result = await apiCall(`/${messageId}/read`, 'PUT', null, userToken);
        console.log('Message marked as read:', result);
        return result;
    } catch (error) {
        console.error('Failed to mark message as read:', error);
    }
}

// Example 8: Get message statistics
async function getMessageStats(userToken) {
    try {
        const result = await apiCall('/stats', 'GET', null, userToken);
        console.log('Message statistics:', result);
        return result.data;
    } catch (error) {
        console.error('Failed to get message stats:', error);
    }
}

// Example 9: Search messages
async function searchMessages(userToken, searchTerm, filters = {}) {
    const queryParams = new URLSearchParams({
        type: 'all',
        search: searchTerm,
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.messageType && { messageType: filters.messageType }),
        ...(filters.priority && { priority: filters.priority })
    });
    
    try {
        const result = await apiCall(`/list?${queryParams}`, 'GET', null, userToken);
        console.log('Search results:', result);
        return result.data;
    } catch (error) {
        console.error('Failed to search messages:', error);
    }
}

// Example 10: Archive a message
async function archiveMessage(userToken, messageId) {
    try {
        const result = await apiCall(`/${messageId}`, 'DELETE', null, userToken);
        console.log('Message archived:', result);
        return result;
    } catch (error) {
        console.error('Failed to archive message:', error);
    }
}

// Example usage scenarios
async function demonstrateMessagingWorkflow() {
    // Assume we have tokens for different user types
    const userToken = 'user_jwt_token';
    const sellerToken = 'seller_jwt_token';
    const adminToken = 'admin_jwt_token';
    
    console.log('=== Messaging System Demo ===\n');
    
    // 1. User sends support request
    console.log('1. User sends support request...');
    const supportMessageId = await userSendsSupport(userToken);
    
    // 2. Seller sends order update
    console.log('\n2. Seller sends order update...');
    const orderUpdateId = await sellerSendsOrderUpdate(sellerToken);
    
    // 3. Admin sends policy update
    console.log('\n3. Admin sends policy update...');
    const policyUpdateId = await superAdminSendsPolicyUpdate(adminToken);
    
    // 4. User checks inbox
    console.log('\n4. User checks inbox...');
    await getUserInbox(userToken, { status: 'SENT', limit: 10 });
    
    // 5. User marks message as read
    if (orderUpdateId) {
        console.log('\n5. User marks order update as read...');
        await markMessageAsRead(userToken, orderUpdateId);
    }
    
    // 6. Get message statistics
    console.log('\n6. Getting message statistics...');
    await getMessageStats(userToken);
    
    // 7. Search for messages
    console.log('\n7. Searching for order-related messages...');
    await searchMessages(userToken, 'order', { messageType: 'ORDER_RELATED' });
    
    console.log('\n=== Demo Complete ===');
}

// Export functions for use in other modules
export {
    userSendsSupport,
    sellerSendsOrderUpdate,
    superAdminSendsPolicyUpdate,
    getUserInbox,
    getConversation,
    replyToMessage,
    markMessageAsRead,
    getMessageStats,
    searchMessages,
    archiveMessage,
    demonstrateMessagingWorkflow
};