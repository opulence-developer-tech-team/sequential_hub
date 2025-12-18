import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { orderService } from "./service";
import { OrderStatus, PaymentStatus } from "./interface";
import { logger } from "../utils/logger";

class OrderController {
  public async getAllOrders(
    page?: number,
    limit?: number,
    filters?: {
      searchTerm?: string;
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      isGuest?: boolean;
    }
  ): Promise<NextResponse> {
    try {
      const result = await orderService.getAllOrders(page, limit, filters);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Orders fetched successfully",
        data: {
          orders: result.orders,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in getAllOrders controller", err, {
        page,
        limit,
        filters,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to fetch orders",
        data: null,
      });
    }
  }

  public async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus
  ): Promise<NextResponse> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid order ID",
          data: null,
        });
      }

      const orderObjectId = new Types.ObjectId(orderId);
      const updatedOrder = await orderService.updateOrderStatus(
        orderObjectId,
        orderStatus
      );

      if (!updatedOrder) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Order not found",
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Order status updated successfully",
        data: updatedOrder,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in updateOrderStatus controller", err, {
        orderId,
        orderStatus,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to update order status",
        data: null,
      });
    }
  }

  public async getUserOrders(
    userId: Types.ObjectId,
    page?: number,
    limit?: number
  ): Promise<NextResponse> {
    try {
      const result = await orderService.getUserOrders(userId, page, limit);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "User orders fetched successfully",
        data: {
          orders: result.orders,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in getUserOrders controller", err, {
        userId: userId.toString(),
        page,
        limit,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to fetch user orders",
        data: null,
      });
    }
  }

  /**
   * Get a single order by ID (for admin)
   */
  public async getOrderById(orderId: string): Promise<NextResponse> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid order ID",
          data: null,
        });
      }

      const orderObjectId = new Types.ObjectId(orderId);
      const order = await orderService.findOrderById(orderObjectId);

      if (!order) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Order not found",
          data: null,
        });
      }

      const orderResponse = orderService.mapOrderToResponse(order);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Order fetched successfully",
        data: orderResponse,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in getOrderById controller", err, {
        orderId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to fetch order",
        data: null,
      });
    }
  }
}

export const orderController = new OrderController();

