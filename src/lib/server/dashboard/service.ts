import { logger } from "../utils/logger";
import Order from "../order/entity";
import MeasurementOrder from "../measurementOrder/entity";
import Product from "../products/entity";
import { OrderStatus, PaymentStatus } from "../order/interface";
import { MeasurementOrderStatus } from "../measurementOrder/interface";

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalMeasurementOrders: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  recentOrders: Array<{
    id: string;
    type: "regular" | "measurement";
    customerName: string;
    amount: number;
    status: string;
    paymentStatus?: string;
    category?: string;
    createdAt: Date;
  }>;
}

class DashboardService {
  public async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all stats in parallel for efficiency
      const [
        totalRegularOrders,
        totalMeasurementOrders,
        totalProducts,
        totalRevenueResult,
        pendingRegularOrders,
        processingRegularOrders,
        shippedOrders,
        deliveredRegularOrders,
        pendingMeasurementOrders,
        processingMeasurementOrders,
        completedMeasurementOrders,
        recentRegularOrders,
        recentMeasurementOrders,
      ] = await Promise.all([
        // Total counts
        Order.countDocuments(),
        MeasurementOrder.countDocuments(),
        Product.countDocuments(),

        // Total revenue - sum of all paid orders
        Order.aggregate([
          {
            $match: {
              paymentStatus: PaymentStatus.Paid,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" },
            },
          },
        ]),

        // Order status counts - Order entity uses 'orderStatus' field
        Order.countDocuments({ orderStatus: OrderStatus.OrderPlaced }),
        Order.countDocuments({ orderStatus: OrderStatus.Processing }),
        Order.countDocuments({ orderStatus: OrderStatus.Shipped }),
        Order.countDocuments({ orderStatus: OrderStatus.Delivered }),

        // Measurement order status counts
        MeasurementOrder.countDocuments({ status: MeasurementOrderStatus.OrderReceived }),
        MeasurementOrder.countDocuments({ status: MeasurementOrderStatus.Sewing }),
        MeasurementOrder.countDocuments({ status: MeasurementOrderStatus.Delivered }),

        // Recent orders (last 5 regular orders)
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .select("_id orderNumber shippingAddress total orderStatus paymentStatus createdAt"),

        // Recent measurement orders (last 5)
        MeasurementOrder.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .select("_id orderNumber customerName price status paymentStatus category createdAt"),
      ]);

      // Calculate total revenue
      const totalRegularRevenue = totalRevenueResult[0]?.total || 0;
      const totalMeasurementRevenue = await MeasurementOrder.aggregate([
        {
          $match: {
            paymentStatus: PaymentStatus.Paid,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$price" },
          },
        },
      ]);
      const totalRevenue = totalRegularRevenue + (totalMeasurementRevenue[0]?.total || 0);

      // Combine order status counts
      const pendingOrders = pendingRegularOrders + pendingMeasurementOrders;
      const processingOrders = processingRegularOrders + processingMeasurementOrders;
      const deliveredOrders = deliveredRegularOrders + completedMeasurementOrders;

      // Map recent orders to response format
      const mappedRecentRegularOrders = recentRegularOrders.map((order: any) => ({
        id: order.orderNumber || order._id?.toString() || "",
        type: "regular" as const,
        customerName: order.shippingAddress
          ? `${order.shippingAddress.firstName || ""} ${order.shippingAddress.lastName || ""}`.trim() || "Guest"
          : "Guest",
        amount: order.total || 0,
        status: order.orderStatus || "pending",
        paymentStatus: order.paymentStatus || "pending",
        createdAt: order.createdAt || new Date(),
      }));

      const mappedRecentMeasurementOrders = recentMeasurementOrders.map((order: any) => ({
        id: order.orderNumber || order._id?.toString() || "",
        type: "measurement" as const,
        customerName: order.customerName || "Guest",
        amount: order.price || 0,
        status: order.status || "pending",
        paymentStatus: order.paymentStatus || "pending",
        category: order.category || undefined,
        createdAt: order.createdAt || new Date(),
      }));

      // Combine and sort recent orders by date
      const recentOrders = [...mappedRecentRegularOrders, ...mappedRecentMeasurementOrders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      return {
        totalRevenue,
        totalOrders: totalRegularOrders,
        totalMeasurementOrders,
        totalProducts,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        recentOrders,
      };
    } catch (error: any) {
      logger.error("Failed to fetch dashboard stats", error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
































