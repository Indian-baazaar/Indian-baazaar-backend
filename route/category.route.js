import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { createCategory, deleteCategory, getCategories, getCategoriesCount, getCategory, getSubCategoriesCount, removeImageFromCloudinary, updatedCategory, uploadImages } from '../controllers/category.controller.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const categoryRouter = Router();

categoryRouter.post('/uploadImages', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);
categoryRouter.post('/create', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createCategory);
categoryRouter.get('/', getCategories);
categoryRouter.get('/get/count', getCategoriesCount);
categoryRouter.get('/get/count/subCat', getSubCategoriesCount);
categoryRouter.get('/:id', getCategory);
categoryRouter.delete('/deteleImage', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);
categoryRouter.delete('/:id', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteCategory);
categoryRouter.put('/:id', endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatedCategory);


export default categoryRouter;