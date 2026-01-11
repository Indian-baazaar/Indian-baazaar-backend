import { Router } from "express";
import auth from "../middlewares/auth.js";
import { addAddressController, deleteAddressController, editAddress, getAddressController, getSingleAddressController } from "../controllers/Address/address.controller.js";
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const addressRouter = Router();
addressRouter.post('/add',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addAddressController)
addressRouter.get('/get',auth,getAddressController)
addressRouter.get('/:id',auth,getSingleAddressController)
addressRouter.delete('/:id',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteAddressController)
addressRouter.put('/:id',auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), editAddress)



export default addressRouter