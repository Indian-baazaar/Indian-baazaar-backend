import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addHomeSlide, deleteMultipleSlides, deleteSlide, getHomeSlides, getSlide, removeImageFromCloudinary, updatedSlide, uploadImages } from '../controllers/homeSlider.controller.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import { superAdminAuth } from '../middlewares/adminAuth.js';

const homeSlidesRouter = Router();

homeSlidesRouter.post('/uploadImages',superAdminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);
homeSlidesRouter.post('/add',superAdminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addHomeSlide);
homeSlidesRouter.get('/', getHomeSlides);
homeSlidesRouter.get('/:id', getSlide);
homeSlidesRouter.delete('/deteleImage',superAdminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);
homeSlidesRouter.delete('/:id',superAdminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteSlide);
homeSlidesRouter.delete('/deleteMultiple',superAdminAuth, endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteMultipleSlides);
homeSlidesRouter.put('/:id',superAdminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatedSlide);


export default homeSlidesRouter;