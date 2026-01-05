import MessageModel from "../models/message.model.js";
import UserModel from "../models/user.model.js";
import SellerModel from "../models/seller.model.js";
import OrderModel from "../models/order.model.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";

const getUserModel = (userType) => {
  switch (userType) {
    case "User":
      return UserModel;
    case "SellerModel":
      return SellerModel;
    case "SuperAdmin":
      return SellerModel;
    default:
      throw new Error("Invalid user type");
  }
};

const validateMessagePermissions = async (
  senderType,
  senderRole,
  receiverType,
  receiverRole,
  orderId = null
) => {
  if (senderRole === "SUPER_ADMIN") {
    return true;
  }

  if (senderType === "User" && senderRole === "USER") {
    return (
      receiverType === "SuperAdmin" ||
      (receiverType === "User" && receiverRole === "SUPER_ADMIN")
    );
  }

  if (senderType === "SellerModel" && senderRole === "RETAILER") {
    if (
      receiverType === "SuperAdmin" ||
      (receiverType === "User" && receiverRole === "SUPER_ADMIN")
    ) {
      return true;
    }
    if (receiverType === "User" && receiverRole === "USER" && orderId) {
      const order = await OrderModel.findOne({
        _id: orderId,
        userId: receiverType === "User" ? receiverRole : null,
        retailerId: senderType === "SellerModel" ? senderRole : null,
      });
      return !!order;
    }
  }

  return false;
};

export const createMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Validation failed",
        details: errors.array(),
      });
    }

    const {
      receiverId,
      receiverType,
      subject,
      content,
      orderId,
      messageType = "GENERAL",
      priority = "MEDIUM",
      parentMessageId,
      tags = [],
    } = req.body;

    const senderId = req.userId;
    const senderType =
      req.userType ||
      (req.user?.role === "SUPER_ADMIN"
        ? "SuperAdmin"
        : req.user?.role === "RETAILER"
        ? "SellerModel"
        : "User");

    const SenderModel = getUserModel(senderType);
    const sender = await SenderModel.findById(senderId);
    console.log("sender : ", sender);

    if (!sender) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Sender not found",
      });
    }

    console.log("receiverType : ", receiverType);

    const ReceiverModel = getUserModel(receiverType);
    
    console.log("ReceiverModel : ", ReceiverModel);
    console.log("receiverId : ",receiverId);

    const receiver = await ReceiverModel.findById(receiverId);
    console.log("receiver : ", receiver);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Receiver not found",
      });
    }

    const hasPermission = await validateMessagePermissions(senderType,sender.role,receiverType,receiver.role,orderId);
    console.log("hasPermission : ",hasPermission);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "You do not have permission to send messages to this user",
      });
    }

    if (orderId) {
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: true,
          message: "Order not found",
        });
      }
    }

    if (parentMessageId) {
      const parentMessage = await MessageModel.findById(parentMessageId);
      if (!parentMessage) {
        return res.status(404).json({
          success: false,
          error: true,
          message: "Parent message not found",
        });
      }
    }

    console.log("yhan tak aa gya")

    const message = new MessageModel({
      sender: {
        id: senderId,
        type: senderType,
      },
      receiver: {
        id: receiverId,
        type: receiverType,
      },
      subject,
      content,
      orderId: orderId || null,
      messageType,
      priority,
      parentMessageId: parentMessageId || null,
      isReply: !!parentMessageId,
      tags,
    });

    await message.save();

    await message.populate([
      { path: "sender.id", select: "name email avatar" },
      { path: "receiver.id", select: "name email avatar" },
      { path: "orderId", select: "channel_order_id order_status totalAmt" },
    ]);

    res.status(201).json({
      success: true,
      error: false,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Create message error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const userType =
      req.userType ||
      (req.user?.role === "SUPER_ADMIN"
        ? "SuperAdmin"
        : req.user?.role === "RETAILER"
        ? "SellerModel"
        : "User");

    const {
      type = "inbox",
      page = 1,
      limit = 20,
      status,
      messageType,
      priority,
      orderId,
      search,
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Build query based on type
    if (type === "inbox") {
      query = {
        "receiver.id": userId,
        "receiver.type": userType,
      };
    } else if (type === "outbox") {
      query = {
        "sender.id": userId,
        "sender.type": userType,
      };
    } else {
      query = {
        $or: [
          { "sender.id": userId, "sender.type": userType },
          { "receiver.id": userId, "receiver.type": userType },
        ],
      };
    }

    // Add filters
    if (status) query.status = status;
    if (messageType) query.messageType = messageType;
    if (priority) query.priority = priority;
    if (orderId) query.orderId = orderId;

    // Add search functionality
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const messages = await MessageModel.find(query)
      .populate("sender.id", "name email avatar")
      .populate("receiver.id", "name email avatar")
      .populate("orderId", "channel_order_id order_status totalAmt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MessageModel.countDocuments(query);

    res.status(200).json({
      success: true,
      error: false,
      message: "Messages retrieved successfully",
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
};

export const getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;
    const userType =
      req.userType ||
      (req.user?.role === "SUPER_ADMIN"
        ? "SuperAdmin"
        : req.user?.role === "RETAILER"
        ? "SellerModel"
        : "User");

    const message = await MessageModel.findById(messageId)
      .populate("sender.id", "name email avatar")
      .populate("receiver.id", "name email avatar")
      .populate("orderId", "channel_order_id order_status totalAmt products")
      .populate("parentMessageId");

    if (!message) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Message not found",
      });
    }

    // Check if user has permission to view this message
    const isAuthorized =
      (message.sender.id._id.toString() === userId &&
        message.sender.type === userType) ||
      (message.receiver.id._id.toString() === userId &&
        message.receiver.type === userType);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "You do not have permission to view this message",
      });
    }

    // Mark as read if user is the receiver and message is not already read
    if (
      message.receiver.id._id.toString() === userId &&
      message.receiver.type === userType &&
      message.status !== "READ"
    ) {
      await message.markAsRead();
    }

    res.status(200).json({
      success: true,
      error: false,
      message: "Message retrieved successfully",
      data: message,
    });
  } catch (error) {
    console.error("Get message by ID error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { otherUserId, otherUserType } = req.params;
    const userId = req.userId;
    const userType =
      req.userType ||
      (req.user?.role === "SUPER_ADMIN"
        ? "SuperAdmin"
        : req.user?.role === "RETAILER"
        ? "SellerModel"
        : "User");

    const { page = 1, limit = 20, orderId } = req.query;

    const messages = await MessageModel.getConversation(
      userId,
      userType,
      otherUserId,
      otherUserType,
      { page: parseInt(page), limit: parseInt(limit), orderId }
    );

    const totalQuery = {
      $or: [
        {
          "sender.id": userId,
          "sender.type": userType,
          "receiver.id": otherUserId,
          "receiver.type": otherUserType,
        },
        {
          "sender.id": otherUserId,
          "sender.type": otherUserType,
          "receiver.id": userId,
          "receiver.type": userType,
        },
      ],
    };

    if (orderId) {
      totalQuery.orderId = orderId;
    }

    const total = await MessageModel.countDocuments(totalQuery);

    res.status(200).json({
      success: true,
      error: false,
      message: "Conversation retrieved successfully",
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;
    const userType =
      req.userType ||
      (req.user?.role === "SUPER_ADMIN"
        ? "SuperAdmin"
        : req.user?.role === "RETAILER"
        ? "SellerModel"
        : "User");

    const message = await MessageModel.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Message not found",
      });
    }

    // Check if user is the receiver
    if (
      message.receiver.id.toString() !== userId ||
      message.receiver.type !== userType
    ) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "You can only mark messages addressed to you as read",
      });
    }

    await message.markAsRead();

    res.status(200).json({
      success: true,
      error: false,
      message: "Message marked as read successfully",
      data: message,
    });
  } catch (error) {
    console.error("Mark message as read error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
};

export const getMessageStats = async (req, res) => {
  try {
    const userId = req.userId;
    const userType =
      req.userType ||
      (req.user?.role === "SUPER_ADMIN"
        ? "SuperAdmin"
        : req.user?.role === "RETAILER"
        ? "SellerModel"
        : "User");

    const stats = await MessageModel.aggregate([
      {
        $match: {
          "receiver.id": new mongoose.Types.ObjectId(userId),
          "receiver.type": userType,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      total: 0,
      unread: 0,
      read: 0,
      archived: 0,
    };

    stats.forEach((stat) => {
      formattedStats.total += stat.count;
      if (stat._id === "SENT" || stat._id === "DELIVERED") {
        formattedStats.unread += stat.count;
      } else if (stat._id === "READ") {
        formattedStats.read += stat.count;
      } else if (stat._id === "ARCHIVED") {
        formattedStats.archived += stat.count;
      }
    });

    res.status(200).json({
      success: true,
      error: false,
      message: "Message statistics retrieved successfully",
      data: formattedStats,
    });
  } catch (error) {
    console.error("Get message stats error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;
    const userType =
      req.userType ||
      (req.user?.role === "SUPER_ADMIN"
        ? "SuperAdmin"
        : req.user?.role === "RETAILER"
        ? "SellerModel"
        : "User");

    const message = await MessageModel.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Message not found",
      });
    }

    // Check if user has permission to delete (sender or receiver)
    const isAuthorized =
      (message.sender.id.toString() === userId &&
        message.sender.type === userType) ||
      (message.receiver.id.toString() === userId &&
        message.receiver.type === userType);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "You do not have permission to delete this message",
      });
    }

    message.status = "ARCHIVED";
    await message.save();

    res.status(200).json({
      success: true,
      error: false,
      message: "Message archived successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
};
