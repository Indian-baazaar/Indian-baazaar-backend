import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addBanner, deleteBanner, getBanner, getBanners, updatedBanner, uploadImages } from '../controllers/bannerV1.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const bannerV1Router = Router();

bannerV1Router.post('/uploadImages', upload.array('images'), uploadImages);
bannerV1Router.post('/add', addBanner);
bannerV1Router.get('/', getBanners);
bannerV1Router.get('/:id', getBanner);
bannerV1Router.delete('/deteleImage', removeImageFromCloudinary);
bannerV1Router.delete('/:id', deleteBanner);
bannerV1Router.put('/:id', updatedBanner);

export default bannerV1Router;