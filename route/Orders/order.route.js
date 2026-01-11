import { Router } from "express";
import auth from "../../middlewares/Basic/auth.js";
import { createOrderController, getOrderDetailsController, getTotalOrdersCountController, getUserOrderDetailsController, totalSalesController, totalUsersController, updateOrderStatusController, verifyPaymentController, getRetailerOrdersController } from "../../controllers/Orders/order.controller.js";
import { endpointSecurity } from "../../middlewares/validation/endpointSecurity.js";
import { validateSellerSettings } from "../../middlewares/Seller/sellerSettingsValidation.js";

const orderRouter = Router();

orderRouter.post('/create', auth, validateSellerSettings, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createOrderController)
orderRouter.post("/verify-payment", auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), verifyPaymentController);
orderRouter.get("/order-list", auth, getOrderDetailsController)
orderRouter.put('/order-status/:id', auth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateOrderStatusController)
orderRouter.get('/count', auth, getTotalOrdersCountController)
orderRouter.get('/sales', auth, totalSalesController)
orderRouter.get('/users', auth, totalUsersController)
orderRouter.get('/order-list/orders', auth, getUserOrderDetailsController)
// orderRouter.delete('/deleteOrder/:id', auth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteOrder)
orderRouter.get('/retailer/orders', auth, getRetailerOrdersController)

export default orderRouter;