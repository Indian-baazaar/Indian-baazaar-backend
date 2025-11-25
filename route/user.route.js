import { Router } from 'express'
import {addReview, authWithGoogle, changePasswordController, forgotPasswordController, getAllReviews, getAllUsers, getReviews, loginAdminController, loginUserController, logoutController, refreshToken, registerRetailerController, registerUserController, removeImageFromCloudinary, resetpassword, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp} from '../controllers/user.controller.js';
import { shiprocketAddressValidation } from '../middlewares/shiprocketValidation.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const userRouter = Router()
userRouter.post('/register', endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), registerUserController)
userRouter.post('/register-retailer', endpointSecurity({ maxRequests: 3, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), shiprocketAddressValidation, registerRetailerController)
userRouter.post('/verifyEmail', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), verifyEmailController)
userRouter.post('/login', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), loginUserController)
userRouter.post('/authWithGoogle', endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), authWithGoogle)
userRouter.get('/logout',auth,logoutController);
userRouter.post('/admin-login', endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), loginAdminController)

// Admin-only: update user avatar
userRouter.put('/user-avatar',  endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }),  upload.array('avatar'), userAvatarController);
userRouter.delete('/deteleImage',auth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);
userRouter.put('/:id', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateUserDetails);
userRouter.post('/forgot-password', endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), forgotPasswordController)
userRouter.post('/verify-forgot-password-otp', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), verifyForgotPasswordOtp)
userRouter.post('/reset-password', endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), resetpassword)
userRouter.post('/forgot-password/change-password', endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), changePasswordController)
userRouter.post('/refresh-token', endpointSecurity({ maxRequests: 20, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), refreshToken)
userRouter.get('/user-details',auth,userDetails);
userRouter.post('/addReview',auth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addReview);
userRouter.get('/getReviews',getReviews);
userRouter.get('/getAllReviews',getAllReviews);
userRouter.get('/getAllUsers',getAllUsers);


export default userRouter