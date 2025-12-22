import express from 'express';
import {CheckpickUpAddressValidator} from '../Validator/pickUpAddress.validator.js';
import {registerPickUpAddress} from '../controllers/pickUpAddress.controller.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import adminAuth from '../middlewares/adminAuth.js';

const shipRocketAddressRoute = express.Router();


shipRocketAddressRoute.post('/create', adminAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckpickUpAddressValidator, registerPickUpAddress);

export default shipRocketAddressRoute;
