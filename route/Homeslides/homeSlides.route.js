import { Router } from 'express'
import upload from '../../middlewares/Basic/multer.js';
import { addHomeSlide, deleteMultipleSlides, deleteSlide, getHomeSlides, getSlide, removeImageFromCloudinary, updatedSlide, uploadImages } from '../../controllers/HomeSlides/homeSlider.controller.js';
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';
import { superAdminAuth } from '../../middlewares/Admin/adminAuth.js';

const homeSlidesRouter = Router();

homeSlidesRouter.post('/uploadImages',superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);
homeSlidesRouter.post('/add',superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addHomeSlide);
homeSlidesRouter.get('/', getHomeSlides);
homeSlidesRouter.get('/:id', getSlide);
homeSlidesRouter.delete('/deteleImage',superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);
homeSlidesRouter.delete('/:id',superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteSlide);
homeSlidesRouter.delete('/deleteMultiple',superAdminAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteMultipleSlides);
homeSlidesRouter.put('/:id',superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatedSlide);


export default homeSlidesRouter;