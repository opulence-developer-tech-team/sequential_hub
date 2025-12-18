import { Types } from "mongoose";

import Admin from "./entity";

class AdminService {
  public async findAdminById(adminId: Types.ObjectId) {
    const admin = await Admin.findById(adminId);
    return admin;
  }

  public async findAdminByEmail(email: string) {
    const user = await Admin.findOne({
      email,
    });

    return user;
  }
}

export const adminService = new AdminService();
