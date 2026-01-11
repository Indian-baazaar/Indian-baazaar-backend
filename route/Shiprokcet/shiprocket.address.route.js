import express from 'express';
import {CheckpickUpAddressValidator} from '../../Validator/pickUpAddress.validator.js';
import {registerPickUpAddress} from '../../controllers/Shiprocket/pickUpAddress.controller.js';
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';
import sellerAuth from '../../middlewares/Seller/sellerAuth.js';

const shipRocketAddressRoute = express.Router();


shipRocketAddressRoute.post('/create', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckpickUpAddressValidator, registerPickUpAddress);

export default shipRocketAddressRoute;
