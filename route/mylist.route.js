import { Router } from "express";
import auth from "../middlewares/auth.js";
import { addToMyListController, deleteToMyListController, getMyListController } from "../controllers/mylist.controller.js";
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const myListRouter = Router();

myListRouter.post('/add',auth, endpointSecurity({ maxRequests: 20, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addToMyListController)
myListRouter.get('/',auth,getMyListController)
myListRouter.delete('/:id',auth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteToMyListController)

export default myListRouter;