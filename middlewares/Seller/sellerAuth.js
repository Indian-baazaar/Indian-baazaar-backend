import jwt from 'jsonwebtoken';
import SellerModel from '../../models/Seller/seller.model.js';
import dotenv from 'dotenv';
dotenv.config();

export default async function sellerAuth(req, res, next) {
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

    if (seller.kycStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Your KYC has been rejected.'
      });
    }

    if (seller.kycStatus === 'pending') {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Your KYC is pending approval.'
      });
    }

    if (seller.sellerStatus === 'inactive') {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Access denied. Your seller account is inactive.'
      });
    }

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