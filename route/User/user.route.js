import { Router } from 'express'
import {addReview, authWithGoogle, changePasswordController, forgotPasswordController, getAllReviews, getAllUsers, getReviews, getUserOrderDetailsController, loginUserController, logoutController, refreshToken, registerUserController, removeImageFromCloudinary, resetpassword, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp} from '../../controllers/User/user.controller.js';
import auth from '../../middlewares/Basic/auth.js';
import upload from '../../middlewares/Basic/multer.js';
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';
import { superAdminAuth } from '../../middlewares/Admin/adminAuth.js';

const userRouter = Router()

userRouter.post('/register', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), registerUserController)

userRouter.post('/verifyEmail', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), verifyEmailController)

userRouter.post('/login', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), loginUserController)

userRouter.post('/authWithGoogle', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), authWithGoogle)

userRouter.get('/logout',auth,logoutController);

userRouter.put('/user-avatar',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }),  upload.array('avatar'), userAvatarController);

userRouter.delete('/deteleImage',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);

userRouter.put('/:id',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateUserDetails);

userRouter.post('/forgot-password', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), forgotPasswordController)

userRouter.post('/verify-forgot-password-otp', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), verifyForgotPasswordOtp)

userRouter.post('/reset-password', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), resetpassword)

userRouter.post('/forgot-password/change-password', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), changePasswordController)

userRouter.post('/refresh-token', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), refreshToken)

userRouter.get('/user-details',endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), auth,userDetails);

userRouter.post('/addReview',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addReview);

userRouter.get('/getReviews',endpointSecurity({ maxRequests: 100, windowMs: 1 * 60 * 1000, blockDurationMs: 3600000 }),getReviews);

userRouter.get('/getAllReviews',endpointSecurity({ maxRequests: 100, windowMs: 1 * 60 * 1000, blockDurationMs: 3600000 }),getAllReviews);

userRouter.get('/getAllUsers', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 1 * 60 * 1000, blockDurationMs: 3600000 }), getAllUsers);

userRouter.get("/order-list", auth, getUserOrderDetailsController)

export default userRouter