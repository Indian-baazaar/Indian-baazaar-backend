import jwt from 'jsonwebtoken';
import UserModel from '../../models/User/user.model.js';
import SellerModel from '../../models/Seller/seller.model.js';
import dotenv from 'dotenv';
dotenv.config();

export const messageAuth = async (req, res, next) => {
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

        let user = await UserModel.findById(decoded.id);
        let userType = 'User';

        if (user) {
            if (user.role === 'SUPER_ADMIN') {
                userType = 'SuperAdmin';
            }
        } else {
            user = await SellerModel.findById(decoded.id);
            if (user) {
                userType = 'SellerModel';
                if (user.status === 'Inactive' || user.status === 'Suspended') {
                    return res.status(403).json({
                        success: false,
                        error: true,
                        message: 'Access denied. Your account is inactive or suspended.'
                    });
                }
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: true,
                message: 'Admin not found'
            });
        }

        if (user.status === 'Inactive' || user.status === 'Suspended') {
            return res.status(403).json({
                success: false,
                error: true,
                message: 'Access denied. Your account is inactive or suspended.'
            });
        }

        req.userId = user._id;
        req.user = user;
        req.userType = userType;

        next();
    } catch (error) {
        console.error('Message Auth Error:', error);
        return res.status(401).json({
            success: false,
            error: true,
            message: 'Authentication failed',
            details: error.message
        });
    }
};

export const requireSuperAdmin = (req, res, next) => {
    if (req.userType !== 'SuperAdmin' || req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            success: false,
            error: true,
            message: 'Access denied. Super Admin privileges required.'
        });
    }
    next();
};

export const requireSeller = (req, res, next) => {
    if (req.userType !== 'SellerModel' || req.user?.role !== 'RETAILER') {
        return res.status(403).json({
            success: false,
            error: true,
            message: 'Access denied. Seller privileges required.'
        });
    }
    next();
};

export const requireUser = (req, res, next) => {
    if (req.userType !== 'User' || req.user?.role !== 'USER') {
        return res.status(403).json({
            success: false,
            error: true,
            message: 'Access denied. User privileges required.'
        });
    }
    next();
};