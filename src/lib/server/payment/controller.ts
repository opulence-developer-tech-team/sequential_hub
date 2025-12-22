import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { paymentService } from "./service";
import { orderService } from "../order/service";
import { measurementOrderService } from "../measurementOrder/service";
import {
  IOrderUserInput,
  PaymentStatus,
  IOrder,
  IOrderResponse,
} from "../order/interface";
import { logger } from "../utils/logger";
import { emailService } from "../utils/email";

class PaymentController {    //ok
  /**
   * Send payment confirmation email
   */
  private async sendPaymentConfirmationEmail(
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    isGuest: boolean,
    orderType: 'regular' | 'measurement',
    orderDetails?: {
      subtotal?: number
      shipping?: number
      tax?: number
      total: number
      deliveryFee?: number
    }
  ): Promise<void> {
    try {
      const emailHtml = emailService.generatePaymentConfirmationEmailTemplate(
        orderNumber,
        customerName,
        isGuest,
        orderType,
        undefined,
        orderDetails
      );

      const emailSent = await emailService.sendEmail({
        to: customerEmail,
        subject: `Payment Confirmed - Order ${orderNumber} - Sequential Hub`,
        html: emailHtml,
      });

      if (!emailSent) {
        logger.warn("Failed to send payment confirmation email", {
          orderNumber,
          customerEmail,
        });
      } else {
        logger.info("Payment confirmation email sent successfully", {
          orderNumber,
          customerEmail,
        });
      }
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error sending payment confirmation email", err, {
        orderNumber,
        customerEmail,
      });
      // Don't throw - email failure shouldn't break payment flow
    }
  }

  /**
   * Initialize checkout with Monnify
   * Creates order and generates payment URL
   */
  public async initializeCheckout(
    userId: Types.ObjectId | null,
    body: IOrderUserInput
  ): Promise<NextResponse> {
    try {
      // Create order first
      const order = await orderService.createOrder(userId, body);

      // Generate payment reference (using order number)
      const paymentReference = order.orderNumber;

      // Prepare customer information from order
      const customerName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
      const customerEmail = order.shippingAddress.email;
      const customerPhone = order.shippingAddress.phone;

      // Get redirect URL (should redirect back to your app)
      // Monnify will append paymentReference and transactionReference as query params
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const redirectUrl = `${baseUrl}/payment/verify`;

      // Create checkout URL with Monnify
      const checkoutResponse = await paymentService.createCheckoutUrl({
        amount: order.total,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhoneNumber: customerPhone.trim(),
        paymentDescription: `Order ${order.orderNumber} - ${order.items.length} item(s)`,
        currencyCode: "NGN",
        contractCode: process.env.MONNIFY_CONTRACT_CODE || "",
        paymentReference,
        redirectUrl,
        metadata: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          userId: userId?.toString() || "guest",
          isGuest: order.isGuest,
        },
      });

      // Update order with payment information
      const updatedOrder = await orderService.updateOrderPayment(
        new Types.ObjectId(order._id),
        {
          monnifyTransactionReference:
            checkoutResponse.responseBody.transactionReference,
          monnifyPaymentReference:
            checkoutResponse.responseBody.paymentReference,
          paymentUrl: checkoutResponse.responseBody.checkoutUrl,
          paymentReference,
        }
      );

      if (!updatedOrder) {
        throw new Error("Failed to update order with payment information");
      }

      logger.info("Checkout initialized successfully", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        transactionReference:
          checkoutResponse.responseBody.transactionReference,
      });

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Checkout initialized successfully",
        data: {
          order: updatedOrder,
          checkoutUrl: checkoutResponse.responseBody.checkoutUrl,
          transactionReference:
            checkoutResponse.responseBody.transactionReference,
          paymentReference: checkoutResponse.responseBody.paymentReference,
        },
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error initializing checkout", err, {
        userId: userId?.toString() || "guest",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Handle specific error cases
      if (err.message.includes("out of stock")) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: err.message,
          data: null,
        });
      }

      if (err.message.includes("units available")) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: err.message,
          data: null,
        });
      }

      if (err.message.includes("Insufficient available stock")) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: err.message,
          data: null,
        });
      }

      if (err.message.includes("email already exists")) {
        return utils.customResponse({
          status: 409,
          message: MessageResponse.Error,
          description: err.message,
          data: null,
        });
      }

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "An error occurred while initializing checkout. Please try again.",
        data: null,
      });
    }
  }

  /**
   * Verify payment transaction
   * Can accept transactionReference, paymentReference, or orderNumber
   */
  public async verifyPayment(
    reference: string
  ): Promise<NextResponse> {
    try {
      // Try to find order by transaction reference first (check both regular and measurement orders)
      let order = await orderService.findOrderByTransactionReference(reference);
      let measurementOrder = await measurementOrderService.findOrderByTransactionReference(reference);

      // If not found, try to find by payment reference
      if (!order) {
        order = await orderService.findOrderByPaymentReference(reference);
      }

      // If still not found, try to find by order number
      if (!order) {
        const orderId = await orderService.findOrderByOrderNumber(reference);
        if (orderId) {
          order = await orderService.findOrderById(orderId);
        }
      }
      if (!measurementOrder) {
        measurementOrder = await measurementOrderService.findOrderByOrderNumber(reference);
      }

      // If neither order type found, return error
      if (!order && !measurementOrder) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Order not found for this reference.",
          data: null,
        });
      }

      // Handle measurement order if found
      if (measurementOrder && !order) {
        // Verify transaction with Monnify using transaction reference
        let transactionData = null;
        if (measurementOrder.monnifyTransactionReference) {
          try {
            transactionData = await paymentService.verifyTransaction(
              measurementOrder.monnifyTransactionReference
            );
          } catch (error) {
            logger.warn("Failed to verify transaction with Monnify", {
              transactionReference: measurementOrder.monnifyTransactionReference,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Determine payment status from transaction data
        let paymentStatus: PaymentStatus = measurementOrder.paymentStatus as PaymentStatus;
        let paidAt: Date | undefined = measurementOrder.paidAt;

        if (transactionData) {
          const monnifyStatus = transactionData.paymentStatus?.toUpperCase();
          if (monnifyStatus === "PAID") {
            paymentStatus = PaymentStatus.Paid;
            paidAt = transactionData.paidOn
              ? new Date(transactionData.paidOn)
              : new Date();
          } else if (monnifyStatus === "FAILED") {
            paymentStatus = PaymentStatus.Failed;
          } else if (monnifyStatus === "CANCELLED" || monnifyStatus === "USER_CANCELLED") {
            paymentStatus = PaymentStatus.Cancelled;
          } else if (monnifyStatus === "PENDING") {
            paymentStatus = PaymentStatus.Pending;
          }
        }

        // Update order payment status if it changed
        const wasPaymentJustConfirmed = 
          measurementOrder.monnifyTransactionReference &&
          (paymentStatus !== measurementOrder.paymentStatus || !measurementOrder.paidAt) &&
          paymentStatus === PaymentStatus.Paid &&
          measurementOrder.paymentStatus !== PaymentStatus.Paid;

        let updatedOrder = null;
        if (
          measurementOrder.monnifyTransactionReference &&
          (paymentStatus !== measurementOrder.paymentStatus || !measurementOrder.paidAt)
        ) {
          updatedOrder = await measurementOrderService.updateMeasurementOrderPaymentStatus(
            measurementOrder.monnifyTransactionReference,
            paymentStatus,
            paidAt
          );
        }

        if (!updatedOrder) {
          // Map existing order to response format
          // measurementOrder is already IMeasurementOrder from findOrderByTransactionReference
          updatedOrder = measurementOrderService.mapOrderToResponse(measurementOrder);
        }

        // Send payment confirmation email if payment was just confirmed
        if (wasPaymentJustConfirmed && updatedOrder) {
          const customerEmail = measurementOrder.email || measurementOrder.guestEmail || '';
          const customerName = measurementOrder.name || 'Valued Customer';
          
          if (customerEmail) {
            const basePrice = updatedOrder.price || 0;
            const deliveryFee = updatedOrder.deliveryFee || 0;
            const taxAmount = updatedOrder.tax || 0;
            const totalAmount = basePrice + deliveryFee + taxAmount;

            await this.sendPaymentConfirmationEmail(
              measurementOrder.orderNumber,
              customerEmail,
              customerName,
              measurementOrder.isGuest,
              'measurement',
              {
                subtotal: basePrice,
                shipping: undefined,
                tax: taxAmount,
                total: totalAmount,
                deliveryFee,
              }
            );
          }
        }

        logger.info("Measurement order payment verified successfully", {
          orderId: measurementOrder._id.toString(),
          orderNumber: measurementOrder.orderNumber,
          transactionReference: measurementOrder.monnifyTransactionReference || "none",
          paymentStatus,
        });

        return utils.customResponse({
          status: 200,
          message: MessageResponse.Success,
          description: "Payment verified successfully",
          data: {
            order: updatedOrder,
            transaction: transactionData,
            orderType: 'measurement',
          },
        });
      }

      // Handle regular order (order is guaranteed to be non-null here)
      if (!order) {
        return utils.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: "Unexpected error: order is null",
          data: null,
        });
      }

      // Verify transaction with Monnify using transaction reference
      let transactionData = null;
      if (order.monnifyTransactionReference) {
        try {
          transactionData = await paymentService.verifyTransaction(
            order.monnifyTransactionReference
          );
        } catch (error) {
          logger.warn("Failed to verify transaction with Monnify", {
            transactionReference: order.monnifyTransactionReference,
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue with order data even if Monnify verification fails
        }
      }

      // Determine payment status from transaction data or use current order status
      let paymentStatus: PaymentStatus = order.paymentStatus as PaymentStatus;
      let paidAt: Date | undefined = order.paidAt;

      if (transactionData) {
        const monnifyStatus = transactionData.paymentStatus?.toUpperCase();
        if (monnifyStatus === "PAID") {
          paymentStatus = PaymentStatus.Paid;
          paidAt = transactionData.paidOn
            ? new Date(transactionData.paidOn)
            : new Date();
        } else if (monnifyStatus === "FAILED") {
          paymentStatus = PaymentStatus.Failed;
        } else if (monnifyStatus === "CANCELLED" || monnifyStatus === "USER_CANCELLED") {
          paymentStatus = PaymentStatus.Cancelled;
        } else if (monnifyStatus === "PENDING") {
          paymentStatus = PaymentStatus.Pending;
        }
        // If status doesn't match any known Monnify status, keep current order status
      }

      // Helper function to map order to response format
      const mapOrderToResponse = (orderData: IOrder): IOrderResponse => {
        return {
          _id: orderData._id.toString(),
          orderNumber: orderData.orderNumber,
          userId: orderData.userId?.toString(),
          isGuest: orderData.isGuest,
          guestEmail: orderData.guestEmail,
          items: orderData.items.map((item: any) => ({
            productId: item.productId.toString(),
            variantId: item.variantId,
            productName: item.productName,
            productSlug: item.productSlug,
            variantImageUrls: Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
              ? item.variantImageUrls
              : (item.variantImageUrl ? [item.variantImageUrl] : []), // Backward compatibility
            variantColor: item.variantColor,
            variantSize: item.variantSize,
            variantPrice: item.variantPrice,
            variantDiscountPrice: item.variantDiscountPrice,
            quantity: item.quantity,
            itemSubtotal: item.itemSubtotal,
            itemTotal: item.itemTotal,
          })),
          shippingAddress: orderData.shippingAddress,
          billingAddress: orderData.billingAddress,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          tax: orderData.tax,
          total: orderData.total,
          shippingLocation: orderData.shippingLocation,
          orderStatus: orderData.orderStatus as any,
          paymentStatus: orderData.paymentStatus as any,
          paymentMethod: orderData.paymentMethod,
          paymentReference: orderData.paymentReference,
          monnifyTransactionReference: orderData.monnifyTransactionReference,
          monnifyPaymentReference: orderData.monnifyPaymentReference,
          paymentUrl: orderData.paymentUrl,
          paidAt: orderData.paidAt,
          inventoryDeductedAt: (orderData as any).inventoryDeductedAt,
          inventoryDeductionFailedAt: (orderData as any).inventoryDeductionFailedAt,
          inventoryDeductionError: (orderData as any).inventoryDeductionError,
          shippedAt: orderData.shippedAt,
          deliveredAt: orderData.deliveredAt,
          cancelledAt: orderData.cancelledAt,
          cancellationReason: orderData.cancellationReason,
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt,
        };
      };

      // Update order payment status if it changed
      let updatedOrder = mapOrderToResponse(order);
      const wasPaymentJustConfirmed = 
        order.monnifyTransactionReference &&
        (paymentStatus !== order.paymentStatus || !order.paidAt) &&
        paymentStatus === PaymentStatus.Paid &&
        order.paymentStatus !== PaymentStatus.Paid;

      if (order.monnifyTransactionReference) {
        // If payment is confirmed as paid, do a single idempotent "paid + inventory" finalize.
        if (paymentStatus === PaymentStatus.Paid) {
          const finalized = await orderService.confirmPaidAndDeductInventory(
            order.monnifyTransactionReference,
            paidAt
          );
          if (finalized) {
            updatedOrder = finalized;
          }
        } else if (
          paymentStatus === PaymentStatus.Failed ||
          paymentStatus === PaymentStatus.Cancelled
        ) {
          // Update payment status and release any held reservation
          const updated = await orderService.updateOrderPaymentStatus(
            order.monnifyTransactionReference,
            paymentStatus,
            paidAt
          );
          if (updated) {
            updatedOrder = updated;
          }
        } else if (paymentStatus !== order.paymentStatus || !order.paidAt) {
          const updated = await orderService.updateOrderPaymentStatus(
            order.monnifyTransactionReference,
            paymentStatus,
            paidAt
          );
          if (updated) {
            updatedOrder = updated;
          }
        }
      }

      if (!updatedOrder) {
        return utils.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: "Failed to update order payment status.",
          data: null,
        });
      }

      // Send payment confirmation email if payment was just confirmed
      if (wasPaymentJustConfirmed) {
        const customerEmail = order.shippingAddress?.email || order.guestEmail || '';
        const customerName = order.shippingAddress 
          ? `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() || 'Valued Customer'
          : 'Valued Customer';
        
        if (customerEmail) {
          await this.sendPaymentConfirmationEmail(
            order.orderNumber,
            customerEmail,
            customerName,
            order.isGuest,
            'regular',
            {
              subtotal: order.subtotal,
              shipping: order.shipping,
              tax: order.tax,
              total: order.total,
            }
          );
        }
      }

      logger.info("Payment verified successfully", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        transactionReference: order.monnifyTransactionReference || "none",
        paymentStatus,
      });

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Payment verified successfully",
        data: {
          order: updatedOrder,
          transaction: transactionData,
        },
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error verifying payment", err, {
        reference,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "An error occurred while verifying payment. Please try again.",
        data: null,
      });
    }
  }

  /**
   * Handle Monnify webhook
   */
  public async handleWebhook(
    payload: any,
    signature: string
  ): Promise<NextResponse> {
    try {
      // Verify webhook signature
      const payloadString = JSON.stringify(payload);
      const isValidSignature = paymentService.verifyWebhookSignature(
        payloadString,
        signature
      );

      if (!isValidSignature) {
        logger.warn("Invalid webhook signature", {
          signature: signature.substring(0, 20) + "...",
        });
        return utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "Invalid webhook signature",
          data: null,
        });
      }

      // Parse webhook payload
      const webhookData = paymentService.parseWebhookPayload(payload);

      if (!webhookData) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid webhook payload",
          data: null,
        });
      }

      // Only process successful payment events
      const webhookPaymentStatus = String(
        webhookData.eventData.paymentStatus || ""
      ).toUpperCase();

      const isPaidEvent =
        webhookData.eventType === "SUCCESSFUL_TRANSACTION" ||
        webhookPaymentStatus === "PAID";

      // Handle FAILED/CANCELLED events
      if (!isPaidEvent) {
        if (webhookPaymentStatus === "FAILED") {
          await orderService.updateOrderPaymentStatus(
            webhookData.eventData.transactionReference,
            PaymentStatus.Failed
          );
        } else if (
          webhookPaymentStatus === "CANCELLED" ||
          webhookPaymentStatus === "USER_CANCELLED"
        ) {
          await orderService.updateOrderPaymentStatus(
            webhookData.eventData.transactionReference,
            PaymentStatus.Cancelled
          );
        }

        logger.info("Webhook event ignored", {
          eventType: webhookData.eventType,
          paymentStatus: webhookData.eventData.paymentStatus,
        });
        return utils.customResponse({
          status: 200,
          message: MessageResponse.Success,
          description: "Webhook received but event ignored",
          data: null,
        });
      }

      // Check metadata to determine order type
      const orderType = webhookData.eventData.metaData?.orderType || 'regular';
      
      // Find order by transaction reference (try regular order first, then measurement order)
      let order = await orderService.findOrderByTransactionReference(
        webhookData.eventData.transactionReference
      );
      
      let measurementOrder = null;
      if (!order || orderType === 'measurement') {
        measurementOrder = await measurementOrderService.findOrderByTransactionReference(
          webhookData.eventData.transactionReference
        );
      }

      if (!order && !measurementOrder) {
        logger.warn("Order not found for webhook", {
          transactionReference: webhookData.eventData.transactionReference,
          orderType,
        });
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Order not found",
          data: null,
        });
      }

      // Update order payment status
      const paidAt = webhookData.eventData.paidOn
        ? new Date(webhookData.eventData.paidOn)
        : new Date();

      if (order) {
        // Handle regular order
        const wasPaymentJustConfirmed = order.paymentStatus !== PaymentStatus.Paid;

        // Idempotent "paid + inventory" finalize (webhooks can be retried)
        const updatedOrder = await orderService.confirmPaidAndDeductInventory(
          webhookData.eventData.transactionReference,
          paidAt
        );

        if (!updatedOrder) {
          return utils.customResponse({
            status: 500,
            message: MessageResponse.Error,
            description: "Failed to update order payment status",
            data: null,
          });
        }

        // Send payment confirmation email
        if (wasPaymentJustConfirmed) {
          const customerEmail = order.shippingAddress?.email || order.guestEmail || '';
          const customerName = order.shippingAddress 
            ? `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() || 'Valued Customer'
            : 'Valued Customer';
          
          if (customerEmail) {
            await this.sendPaymentConfirmationEmail(
              order.orderNumber,
              customerEmail,
              customerName,
              order.isGuest,
              'regular',
              {
                subtotal: updatedOrder.subtotal,
                shipping: updatedOrder.shipping,
                tax: updatedOrder.tax,
                total: updatedOrder.total,
              }
            );
          }
        }

        logger.info("Webhook processed successfully", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          transactionReference: webhookData.eventData.transactionReference,
          paymentStatus: webhookData.eventData.paymentStatus,
          orderType: 'regular',
        });

        return utils.customResponse({
          status: 200,
          message: MessageResponse.Success,
          description: "Webhook processed successfully",
          data: {
            order: updatedOrder,
            orderType: 'regular',
          },
        });
      } else if (measurementOrder) {
        // Handle measurement order
        const wasPaymentJustConfirmed = measurementOrder.paymentStatus !== PaymentStatus.Paid;

        const updatedOrder = await measurementOrderService.updateMeasurementOrderPaymentStatus(
          webhookData.eventData.transactionReference,
          PaymentStatus.Paid,
          paidAt
        );

        if (!updatedOrder) {
          return utils.customResponse({
            status: 500,
            message: MessageResponse.Error,
            description: "Failed to update measurement order payment status",
            data: null,
          });
        }

        // Send payment confirmation email
        if (wasPaymentJustConfirmed && updatedOrder) {
          const customerEmail = measurementOrder.email || measurementOrder.guestEmail || '';
          const customerName = measurementOrder.name || 'Valued Customer';
          
          if (customerEmail) {
            const basePrice = updatedOrder.price || 0;
            const deliveryFee = updatedOrder.deliveryFee || 0;
            const taxAmount = updatedOrder.tax || 0;
            const totalAmount = basePrice + deliveryFee + taxAmount;

            await this.sendPaymentConfirmationEmail(
              measurementOrder.orderNumber,
              customerEmail,
              customerName,
              measurementOrder.isGuest,
              'measurement',
              {
                subtotal: basePrice,
                shipping: undefined,
                tax: taxAmount,
                total: totalAmount,
                deliveryFee,
              }
            );
          }
        }

        logger.info("Webhook processed successfully", {
          orderId: measurementOrder._id.toString(),
          orderNumber: measurementOrder.orderNumber,
          transactionReference: webhookData.eventData.transactionReference,
          paymentStatus: webhookData.eventData.paymentStatus,
          orderType: 'measurement',
        });

        return utils.customResponse({
          status: 200,
          message: MessageResponse.Success,
          description: "Webhook processed successfully",
          data: {
            order: updatedOrder,
            orderType: 'measurement',
          },
        });
      }

      // This should never be reached if logic is correct, but handle edge case
      logger.warn("Webhook handler reached unexpected code path", {
        transactionReference: webhookData.eventData.transactionReference,
        hasOrder: !!order,
        hasMeasurementOrder: !!measurementOrder,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Unexpected error: unable to process webhook",
        data: null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error handling webhook", err, {
        stack: error instanceof Error ? error.stack : undefined,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "An error occurred while processing webhook",
        data: null,
      });
    }
  }

  /**
   * Initialize checkout for measurement order with Monnify
   */
  public async initializeMeasurementOrderCheckout(
    orderId: string
  ): Promise<NextResponse> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid order ID format",
          data: null,
        });
      }

      // Find the measurement order
      const order = await measurementOrderService.findOrderById(
        new Types.ObjectId(orderId)
      );

      if (!order) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Measurement order not found",
          data: null,
        });
      }

      // If this order has been replaced by another one (e.g. after a price update),
      // it is no longer valid for payment. The user should use the latest receipt.
      if ((order as any).isReplaced || (order as any).replacedByOrderId) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description:
            "This measurement order is no longer valid because the price was updated. Please use the latest order/receipt sent to your email.",
          data: null,
        });
      }

      // Do not initialize checkout again for a paid order
      if (order.paymentStatus === PaymentStatus.Paid) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "This measurement order has already been paid.",
          data: null,
        });
      }

      // Check if price is set
      if (!order.price || order.price <= 0) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Price not set for this measurement order",
          data: null,
        });
      }

      // Generate payment reference (using order number)
      const paymentReference = order.orderNumber;

      // Prepare customer information from order
      const customerName = order.name;
      const customerEmail = order.email;
      const customerPhone = order.phone;

      // Get redirect URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const redirectUrl = `${baseUrl}/payment/verify`;

      // Create checkout URL with Monnify
      const checkoutResponse = await paymentService.createCheckoutUrl({
        amount: order.price,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhoneNumber: customerPhone.trim(),
        paymentDescription: `Measurement Order ${order.orderNumber} - ${order.templates.length} template(s)`,
        currencyCode: "NGN",
        contractCode: process.env.MONNIFY_CONTRACT_CODE || "",
        paymentReference,
        redirectUrl,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          orderType: "measurement",
          userId: order.userId?.toString() || "guest",
          isGuest: order.isGuest,
        },
      });

      // Update order with payment information
      const updatedOrder = await measurementOrderService.updateMeasurementOrderPayment(
        new Types.ObjectId(order._id),
        {
          monnifyTransactionReference:
            checkoutResponse.responseBody.transactionReference,
          monnifyPaymentReference:
            checkoutResponse.responseBody.paymentReference,
          paymentUrl: checkoutResponse.responseBody.checkoutUrl,
          paymentReference,
        }
      );

      if (!updatedOrder) {
        throw new Error("Failed to update measurement order with payment information");
      }

      logger.info("Measurement order checkout initialized successfully", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        transactionReference:
          checkoutResponse.responseBody.transactionReference,
      });

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Checkout initialized successfully",
        data: {
          order: updatedOrder,
          checkoutUrl: checkoutResponse.responseBody.checkoutUrl,
          transactionReference:
            checkoutResponse.responseBody.transactionReference,
          paymentReference: checkoutResponse.responseBody.paymentReference,
        },
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error initializing measurement order checkout", err, {
        orderId,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "An error occurred while initializing checkout. Please try again.",
        data: null,
      });
    }
  }
}

export const paymentController = new PaymentController();
