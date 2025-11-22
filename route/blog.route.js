import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addBlog, deleteBlog, getBlog, getBlogs, updateBlog, uploadImages } from '../controllers/blog.controller.js';

const blogRouter = Router();

blogRouter.post('/uploadImages', upload.array('images'), uploadImages);
blogRouter.post('/add', addBlog);
blogRouter.get('/', getBlogs);
blogRouter.get('/:id', getBlog);
blogRouter.delete('/:id', deleteBlog);
blogRouter.put('/:id', updateBlog);

export default blogRouter;