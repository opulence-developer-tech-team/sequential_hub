import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";
import { dashboardService } from "./service";
import { logger } from "../utils/logger";

class DashboardController {
  public async getDashboardStats() {
    try {
      const stats = await dashboardService.getDashboardStats();

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Dashboard stats fetched successfully",
        data: stats,
      });
    } catch (error: any) {
      logger.error("Failed to fetch dashboard stats", error);
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to fetch dashboard statistics",
        data: null,
      });
    }
  }
}

export const dashboardController = new DashboardController();
































