import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addHomeSlide, deleteMultipleSlides, deleteSlide, getHomeSlides, getSlide, removeImageFromCloudinary, updatedSlide, uploadImages } from '../controllers/homeSlider.controller.js';

const homeSlidesRouter = Router();

homeSlidesRouter.post('/uploadImages',  upload.array('images'), uploadImages);
homeSlidesRouter.post('/add',  addHomeSlide);
homeSlidesRouter.get('/', getHomeSlides);
homeSlidesRouter.get('/:id', getSlide);
homeSlidesRouter.delete('/deteleImage',  removeImageFromCloudinary);
homeSlidesRouter.delete('/:id',  deleteSlide);
homeSlidesRouter.delete('/deleteMultiple',  deleteMultipleSlides);
homeSlidesRouter.put('/:id',  updatedSlide);


export default homeSlidesRouter;