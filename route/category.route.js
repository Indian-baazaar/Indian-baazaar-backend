import { Router } from 'express'
import upload from '../middlewares/multer.js';
import { createCategory, deleteCategory, getCategories, getCategoriesCount, getCategory, getSubCategoriesCount, removeImageFromCloudinary, updatedCategory, uploadImages } from '../controllers/category.controller.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import sellerAuth from '../middlewares/sellerAuth.js';

const categoryRouter = Router();

categoryRouter.post('/uploadImages',sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);

categoryRouter.post('/create',sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createCategory);

categoryRouter.get('/', getCategories);

categoryRouter.get('/get/count', getCategoriesCount);

categoryRouter.get('/get/count/subCat', getSubCategoriesCount);

categoryRouter.get('/:id', getCategory);

categoryRouter.delete('/deteleImage',sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);

categoryRouter.delete('/:id',sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteCategory);

categoryRouter.put('/:id',sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatedCategory);


export default categoryRouter;