import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { measurementOrderService } from "./service";
import { IMeasurementOrderUserInput, MeasurementOrderStatus } from "./interface";
import { logger } from "../utils/logger";

class MeasurementOrderController {
  public async createMeasurementOrder(
    userId: Types.ObjectId | null,
    body: IMeasurementOrderUserInput
  ): Promise<NextResponse> {
    try {
      const order = await measurementOrderService.createMeasurementOrder(
        userId,
        body
      );

      return utils.customResponse({
        status: 201,
        message: MessageResponse.Success,
        description: "Measurement order created successfully",
        data: order,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in createMeasurementOrder controller", err, {
        userId: userId?.toString() || "guest",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to create measurement order",
        data: null,
      });
    }
  }

  public async getAllOrders(
    page?: number,
    limit?: number,
    filters?: {
      searchTerm?: string;
      status?: MeasurementOrderStatus;
      isGuest?: boolean;
    }
  ): Promise<NextResponse> {
    try {
      const result = await measurementOrderService.getAllOrders(page, limit, filters);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement orders fetched successfully",
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
        description: err.message || "Failed to fetch measurement orders",
        data: null,
      });
    }
  }

  public async updateMeasurementOrderStatus(
    orderId: string,
    status: MeasurementOrderStatus
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
      const updatedOrder = await measurementOrderService.updateMeasurementOrderStatus(
        orderObjectId,
        status
      );

      if (!updatedOrder) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Measurement order not found",
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement order status updated successfully",
        data: updatedOrder,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in updateMeasurementOrderStatus controller", err, {
        orderId,
        status,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to update measurement order status",
        data: null,
      });
    }
  }

  public async setMeasurementOrderPrice(
    orderId: string,
    price: number,
    adminId: Types.ObjectId
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

      if (price < 0) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Price must be greater than or equal to 0",
          data: null,
        });
      }

      const orderObjectId = new Types.ObjectId(orderId);
      const updatedOrder = await measurementOrderService.setMeasurementOrderPrice(
        orderObjectId,
        price,
        adminId
      );

      if (!updatedOrder) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Measurement order not found",
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement order price set successfully",
        data: updatedOrder,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in setMeasurementOrderPrice controller", err, {
        orderId,
        price,
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status:
          err.message &&
          err.message.includes("Cannot change the price of a measurement order that has already been paid.")
            ? 400
            : 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to set measurement order price",
        data: null,
      });
    }
  }

  public async getUserMeasurementOrders(
    userId: Types.ObjectId,
    page?: number,
    limit?: number
  ): Promise<NextResponse> {
    try {
      const result = await measurementOrderService.getUserMeasurementOrders(userId, page, limit);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "User measurement orders fetched successfully",
        data: {
          orders: result.orders,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in getUserMeasurementOrders controller", err, {
        userId: userId.toString(),
        page,
        limit,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to fetch user measurement orders",
        data: null,
      });
    }
  }

  /**
   * Get a single measurement order by ID (for admin)
   */
  public async getMeasurementOrderById(orderId: string): Promise<NextResponse> {
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
      const order = await measurementOrderService.findOrderById(orderObjectId);

      if (!order) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Measurement order not found",
          data: null,
        });
      }

      const orderResponse = measurementOrderService.mapOrderToResponse(order);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement order fetched successfully",
        data: orderResponse,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in getMeasurementOrderById controller", err, {
        orderId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to fetch measurement order",
        data: null,
      });
    }
  }
}

export const measurementOrderController = new MeasurementOrderController();
