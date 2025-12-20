import { Router } from 'express'
import upload from '../middlewares/multer.js';
import {createProduct, createProductRAMS, deleteMultipleProduct, deleteProduct, deleteProductRAMS, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getAllProductsByThirdLavelCatId, getProduct, getProductRams, getProductsCount, updateProduct, updateProductRam, uploadImages, getProductRamsById, createProductWEIGHT, deleteProductWEIGHT, updateProductWeight, getProductWeight, getProductWeightById, createProductSize, deleteProductSize, updateProductSize, getProductSize, getProductSizeById, uploadBannerImages, getAllProductsBanners, filters, sortBy, searchProductController, getAllProductsByCat} from '../controllers/product.controller.js';

import { checkRetailerBankDetails } from '../middlewares/checkRetailerBankDetails.js';
import { removeImageFromCloudinary } from '../controllers/user.controller.js';
import adminAuth from '../middlewares/adminAuth.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const productRouter = Router();

productRouter.post('/uploadImages',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);
productRouter.post('/uploadBannerImages', adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('bannerimages'), uploadBannerImages);
productRouter.post('/create', checkRetailerBankDetails, adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProduct);
productRouter.get('/getAllProducts', getAllProducts);
productRouter.get('/getAllProductsBanners', getAllProductsBanners);
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsByCatId', getAllProductsByCat);
productRouter.get('/getAllProductsByCatName', getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatId/:id', getAllProductsBySubCatId);
productRouter.get('/getAllProductsBySubCatName', getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCat/:id', getAllProductsByThirdLavelCatId);
productRouter.get('/getAllProductsByThirdLavelCatName', getAllProductsBySubCatName);
productRouter.get('/getAllProductsByPrice', getAllProductsByPrice);
productRouter.get('/getAllProductsByRating', getAllProductsByRating);
productRouter.get('/getAllProductsCount', getProductsCount);
productRouter.get('/getAllFeaturedProducts', getAllFeaturedProducts);
productRouter.delete('/deleteMultiple',adminAuth, endpointSecurity({ maxRequests: 50, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteMultipleProduct);
productRouter.delete('/:id',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProduct);
productRouter.get('/:id', getProduct);
productRouter.delete('/deteleImage',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);
productRouter.put('/updateProduct/:id',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProduct);

productRouter.post('/productRAMS/create', adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProductRAMS);
productRouter.delete('/productRAMS/:id', adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProductRAMS);
productRouter.put('/productRAMS/:id', adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProductRam);
productRouter.get('/productRAMS/get', getProductRams);
productRouter.get('/productRAMS/:id', getProductRamsById);

productRouter.post('/productWeight/create', adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProductWEIGHT);
productRouter.delete('/productWeight/:id', adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProductWEIGHT);
productRouter.put('/productWeight/:id',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProductWeight);
productRouter.get('/productWeight/get', getProductWeight);
productRouter.get('/productWeight/:id', getProductWeightById);


productRouter.post('/productSize/create',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProductSize);
productRouter.delete('/productSize/:id',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProductSize);
productRouter.put('/productSize/:id',adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProductSize);
productRouter.get('/productSize/get', getProductSize);
productRouter.get('/productSize/:id', getProductSizeById);

productRouter.post('/filters', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), filters);
productRouter.post('/sortBy', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), sortBy);
productRouter.post('/search/get', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), searchProductController);

export default productRouter;