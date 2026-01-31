import { Router } from 'express'
import upload from '../../middlewares/Basic/multer.js';
import { addBanner, deleteBanner, getBanner, getBanners, updatedBanner, uploadImages } from '../../controllers/Banner/bannerList2.controller.js';
import { removeImageFromCloudinary } from '../../controllers/category/category.controller.js';
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';
import { superAdminAuth } from '../../middlewares/Admin/adminAuth.js';

const bannerList2Router = Router();

bannerList2Router.post('/uploadImages', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);
bannerList2Router.post('/add', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addBanner);
bannerList2Router.get('/', getBanners);
bannerList2Router.get('/:id', getBanner);
bannerList2Router.delete('/deteleImage', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);
bannerList2Router.delete('/:id', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteBanner);
bannerList2Router.put('/:id', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatedBanner);

export default bannerList2Router;