import { Router } from "express";
import { createOrderController, getOrderDetailsController, getTotalOrdersCountController, getUserOrderDetailsController, totalSalesController, totalUsersController, updateOrderStatusController, verifyPaymentController, getRetailerOrdersController } from "../../controllers/Orders/order.controller.js";
import { endpointSecurity } from "../../middlewares/validation/endpointSecurity.js";
import { validateSellerSettings } from "../../middlewares/Seller/sellerSettingsValidation.js";
import sellerAuth from "../../middlewares/Seller/sellerAuth.js";

const orderRouter = Router();

orderRouter.post('/create', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createOrderController)
orderRouter.post("/verify-payment", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), verifyPaymentController);
orderRouter.get("/order-list", sellerAuth, getOrderDetailsController)
orderRouter.put('/order-status/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateOrderStatusController)
orderRouter.get('/count', sellerAuth, getTotalOrdersCountController)
orderRouter.get('/sales', sellerAuth, totalSalesController)
orderRouter.get('/users', sellerAuth, totalUsersController)
orderRouter.get('/order-list/orders', sellerAuth, getUserOrderDetailsController)
// orderRouter.delete('/deleteOrder/:id', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteOrder)
orderRouter.get('/retailer/orders', sellerAuth, getRetailerOrdersController)

export default orderRouter;