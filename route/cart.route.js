import { Router } from "express";
import { addToCartItemController, deleteCartItemQtyController, emptyCartController, getCartItemController, updateCartItemQtyController } from "../controllers/cart.controller.js";
import auth from "../middlewares/auth.js";
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const cartRouter = Router();

cartRouter.post('/add',auth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addToCartItemController)
cartRouter.get("/get",auth,getCartItemController)
cartRouter.put('/update-qty',auth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateCartItemQtyController)
cartRouter.delete('/delete-cart-item/:id',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteCartItemQtyController)
cartRouter.delete('/emptyCart/:id',auth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), emptyCartController)
export default cartRouter