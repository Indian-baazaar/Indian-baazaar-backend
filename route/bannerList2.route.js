import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addBanner, deleteBanner, getBanner, getBanners, updatedBanner, uploadImages } from '../controllers/bannerList2.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const bannerList2Router = Router();

bannerList2Router.post('/uploadImages', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);
bannerList2Router.post('/add', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addBanner);
bannerList2Router.get('/', getBanners);
bannerList2Router.get('/:id', getBanner);
bannerList2Router.delete('/deteleImage', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);
bannerList2Router.delete('/:id', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteBanner);
bannerList2Router.put('/:id', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatedBanner);

export default bannerList2Router;