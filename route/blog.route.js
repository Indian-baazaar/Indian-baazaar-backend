import { Router } from 'express'
import upload from '../middlewares/multer.js';
import { addBlog, deleteBlog, getBlog, getBlogs, updateBlog, uploadImages } from '../controllers/blog.controller.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import { superAdminAuth } from '../middlewares/adminAuth.js';

const blogRouter = Router();

blogRouter.post('/uploadImages',superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), upload.array('images'), uploadImages);
blogRouter.post('/add',superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addBlog);
blogRouter.get('/', getBlogs);
blogRouter.get('/:id', getBlog);
blogRouter.delete('/:id', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteBlog);
blogRouter.put('/:id', superAdminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateBlog);

export default blogRouter;