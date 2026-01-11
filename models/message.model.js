import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "sender.type"
    },
    type: {
      type: String,
      enum: ["User", "SellerModel"],
      required: true
    }
  },

  receiver: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "receiver.type"
    },
    type: {
      type: String,
      enum: ["User", "SellerModel"],
      required: true
    }
  },

  subject: {
    type: String,
    required: true,
    maxlength: 200
  },

  content: {
    type: String,
    required: true,
    maxlength: 2000
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "order",
    default: null
  },

  messageType: {
    type: String,
    enum: ["GENERAL", "ORDER_RELATED", "SUPPORT", "COMPLAINT"],
    default: "GENERAL"
  },

  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    default: "MEDIUM"
  },

  status: {
    type: String,
    enum: ["SENT", "DELIVERED", "READ", "ARCHIVED"],
    default: "SENT"
  },

  readAt: Date,

  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  },

  isReply: {
    type: Boolean,
    default: false
  },

  tags: [String]

}, { timestamps: true });

messageSchema.index({ "sender.id": 1 });
messageSchema.index({ "receiver.id": 1 });
messageSchema.index({ createdAt: -1 });

messageSchema.methods.markAsRead = async function () {
  this.status = "READ";
  this.readAt = new Date();
  await this.save();
};

export default mongoose.model("Message", messageSchema);
