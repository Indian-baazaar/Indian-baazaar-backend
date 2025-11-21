import { Router } from "express";
import auth from "../middlewares/auth.js";
import { superAdminAuth } from "../middlewares/adminAuth.js";
import { createOrderController, deleteOrder, getOrderDetailsController, getTotalOrdersCountController, getUserOrderDetailsController, totalSalesController, totalUsersController, updateOrderStatusController, approvePayment } from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post('/create',auth,createOrderController)
orderRouter.get("/order-list",auth,getOrderDetailsController)
orderRouter.put('/order-status/:id',auth,updateOrderStatusController)
orderRouter.get('/count',auth,getTotalOrdersCountController)
orderRouter.get('/sales',auth,totalSalesController)
orderRouter.get('/users',auth,totalUsersController)
orderRouter.get('/order-list/orders',auth,getUserOrderDetailsController)
orderRouter.delete('/deleteOrder/:id',auth,deleteOrder)
orderRouter.post('/approve-payment/:orderId', superAdminAuth, approvePayment)

export default orderRouter;