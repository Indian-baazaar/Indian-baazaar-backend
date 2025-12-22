import jwt from 'jsonwebtoken';
import SellerModel from '../models/seller.model.js';
import dotenv from 'dotenv';
dotenv.config();

export default async function sellerAuth(req, res, next) {
  try {
    // Extract token from Authorization header or query parameter
    let token = req.headers?.authorization?.split(' ')[1];
    if (!token) token = req.query?.token;

    // Requirement 12.1: Reject requests without valid JWT
    if (!token) {
      return res.status(401).json({
        success: false,
        error: true,
        message: 'Access token is required'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: true,
        message: 'Invalid or expired token'
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        error: true,
        message: 'Invalid token payload'
      });
    }

    // Find seller by ID
    const seller = await SellerModel.findById(decoded.id);

    if (!seller) {
      // Requirement 12.2: Non-seller users get 403
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Seller account not found.'
      });
    }

    // Requirement 1.5: Check kycStatus - rejected sellers cannot access
    if (seller.kycStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Your KYC has been rejected.'
      });
    }

    // Requirement 1.5: Check kycStatus - pending sellers cannot access protected routes
    if (seller.kycStatus === 'pending') {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Your KYC is pending approval.'
      });
    }

    // Requirement 1.5: Check sellerStatus - inactive sellers cannot access
    if (seller.sellerStatus === 'inactive') {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Your seller account is inactive.'
      });
    }

    // Attach seller object to request
    req.sellerId = seller._id;
    req.seller = seller;

    next();
  } catch (error) {
    console.error('Seller Auth Error:', error);
    return res.status(401).json({
      success: false,
      error: true,
      message: 'Authentication failed'
    });
  }
}

export async function basicSellerAuth(req, res, next) {
  try {
    let token = req.headers?.authorization?.split(' ')[1];
    if (!token) token = req.query?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: true,
        message: 'Access token is required'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: true,
        message: 'Invalid or expired token'
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        error: true,
        message: 'Invalid token payload'
      });
    }

    const seller = await SellerModel.findById(decoded.id);

    if (!seller) {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Seller account not found.'
      });
    }

    req.sellerId = seller._id;
    req.seller = seller;

    next();
  } catch (error) {
    console.error('Basic Seller Auth Error:', error);
    return res.status(401).json({
      success: false,
      error: true,
      message: 'Authentication failed'
    });
  }
}
