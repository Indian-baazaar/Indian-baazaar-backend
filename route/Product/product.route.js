import { Router } from 'express'
import upload from '../../middlewares/Basic/multer.js';
import {createProduct, createProductRAMS, deleteMultipleProduct, deleteProduct, deleteProductRAMS, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getAllProductsByThirdLavelCatId, getProduct, getProductRams, getProductsCount, updateProduct, updateProductRam, uploadImages, getProductRamsById, createProductWEIGHT, deleteProductWEIGHT, updateProductWeight, getProductWeight, getProductWeightById, createProductSize, deleteProductSize, updateProductSize, getProductSize, getProductSizeById, uploadBannerImages, getAllProductsBanners, filters, sortBy, searchProductController, getAllProductsByCat, getUsersAllProducts} from '../../controllers/Products/product.controller.js';
import { checkRetailerBankDetails } from '../../middlewares/Seller/checkRetailerBankDetails.js';
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';
import sellerAuth from '../../middlewares/Seller/sellerAuth.js';
import { removeImageFromCloudinary } from '../../controllers/User/user.controller.js';

const productRouter = Router();

productRouter.post('/uploadImages', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);

productRouter.post('/uploadBannerImages',  sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('bannerimages'), uploadBannerImages);

productRouter.post('/create', sellerAuth, checkRetailerBankDetails,  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProduct);

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
productRouter.get('/getUserProducts', sellerAuth, getUsersAllProducts);
productRouter.get('/getAllFeaturedProducts', getAllFeaturedProducts);

productRouter.delete('/deleteMultiple', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteMultipleProduct);

productRouter.delete('/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProduct);

productRouter.get('/:id', getProduct);

productRouter.delete('/deteleImage', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeImageFromCloudinary);

productRouter.put('/updateProduct/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProduct);

productRouter.post('/productRAMS/create',  sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProductRAMS);

productRouter.delete('/productRAMS/:id',  sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProductRAMS);

productRouter.put('/productRAMS/:id',  sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProductRam);

productRouter.get('/productRAMS/get', getProductRams);

productRouter.get('/productRAMS/:id', getProductRamsById);

productRouter.post('/productWeight/create',  sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProductWEIGHT);

productRouter.delete('/productWeight/:id',  sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProductWEIGHT);

productRouter.put('/productWeight/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProductWeight);

productRouter.get('/productWeight/get', getProductWeight);

productRouter.get('/productWeight/:id', getProductWeightById);

productRouter.post('/productSize/create', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProductSize);

productRouter.delete('/productSize/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProductSize);

productRouter.put('/productSize/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProductSize);

productRouter.get('/productSize/get', getProductSize);
productRouter.get('/productSize/:id', getProductSizeById);

productRouter.post('/filters', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), filters);
productRouter.post('/sortBy', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), sortBy);
productRouter.post('/search/get', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), searchProductController);

export default productRouter;