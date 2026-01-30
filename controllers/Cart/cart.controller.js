import CartProductModel from "../../models/Cart/cartProduct.modal.js";
import { getCache, setCache, delCache } from '../../utils/Redis/redisUtil.js';

export const addToCartItemController = async (request, response) => {
  try {
    const userId = request.userId;
    const { productTitle, image, rating, price, oldPrice, quantity, subTotal, productId, countInStock, discount, size, weight, ram, brand } = request.body;

    const requiredFields = {
      productTitle,
      image,
      rating,
      price,
      quantity,
      subTotal,
      productId,
      countInStock
    };

    for (const field in requiredFields) {
      if (
        requiredFields[field] === undefined ||
        requiredFields[field] === null ||
        requiredFields[field] === ""
      ) {
        return response.status(400).json({
          message: `${field} is required`,
          error: true,
          success: false
        });
      }
    }

     if (quantity <= 0) {
      return response.status(400).json({
        message: "quantity must be greater than 0",
        error: true,
        success: false
      });
    }

    if (price <= 0) {
      return response.status(400).json({
        message: "price must be greater than 0",
        error: true,
        success: false
      });
    }

    if (subTotal <= 0) {
      return response.status(400).json({
        message: "subTotal must be greater than 0",
        error: true,
        success: false
      });
    }

    const existingItem = await CartProductModel.findOne({
      userId,
      productId
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subTotal = existingItem.quantity * price;

      await existingItem.save();
      await delCache(`cart_${userId}`);

      return response.status(200).json({
        message: "Cart item quantity updated",
        error: false,
        success: true,
        data: existingItem
      });
    }

    const cartItem = new CartProductModel({
      productTitle,
      image,
      rating,
      price,
      oldPrice,
      quantity,
      subTotal,
      productId,
      countInStock,
      userId,
      brand,
      discount,
      size,
      weight,
      ram
    });

    const save = await cartItem.save();
    await delCache(`cart_${userId}`);

    return response.status(200).json({
      message: "Item added to cart",
      error: false,
      success: true,
      data: save
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
};


export const getCartItemController = async (request, response) => {
    try {
        const userId = request.userId;
        const cacheKey = `cart_${userId}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return response.json(cachedData);
        }
        const cartItems = await CartProductModel.find({ userId: userId });
        const responseData = {
            cartItems,
            error: false,
            success: true
        };
        await setCache(cacheKey, responseData);
        return response.json(responseData);
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const updateCartItemQtyController = async (request, response) => {
    try {
        const userId = request.userId
        const { _id, qty , sub_total, size, weight, ram} = request.body
        if (!_id || !qty) {
            return response.status(400).json({
                message: "provide _id, qty"
            })
        }
        const updateCartitem = await CartProductModel.updateOne(
            {
                _id: _id,
                userId: userId
            },
            {
                quantity: qty,
                subTotal: sub_total,
                size:size,
                ram:ram,
                weight:weight
            },
            { new: true }
        )
        await delCache(`cart_${userId}`);
        return response.json({
            message: "Update cart item",
            success: true,
            error: false,
            data: updateCartitem
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const deleteCartItemQtyController = async (request, response) => {
    try {
        const userId = request.userId;
        const { id } = request.params;
        if(!id){
            return response.status(400).json({
                message : "Provide _id",
                error : true,
                success : false
            })
          }
          const deleteCartItem  = await CartProductModel.deleteOne({_id : id, userId : userId })
          await delCache(`cart_${userId}`);
          if(!deleteCartItem){
            return response.status(404).json({
                message:"The product in the cart is not found",
                error:true,
                success:false
            })
          }
          return response.status(200).json({
            message : "Item remove",
            error : false,
            success : true,
            data : deleteCartItem
          })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const emptyCartController = async (request, response) => {
    try {
        const userId = request.userId;
        if (!userId) {
            return response.status(401).json({
                message: "Unauthorized",
                error: true,
                success: false
            });
        }
        await CartProductModel.deleteMany({userId: userId});
        await delCache(`cart_${userId}`);
        return response.status(200).json({
            message: "Cart emptied successfully",
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}