import { utils } from "../utils";
import { CustomRequest } from "../utils/interface";
import { adminService } from "../admin/service";
import { AdminRole } from "../admin/enum";
import { Types } from "mongoose";
import { MessageResponse } from "../utils/enum";

export default class GeneralMiddleware {

  static async isSuperAdmin(req: CustomRequest) {
    const { adminRole } = req as CustomRequest;

    if (adminRole !== AdminRole.SuperAdmin) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "You are not authorized to make this request!",
          data: null,
        }),
      };
    }

    return {
      valid: true,
    };
  }

  static async doesAdminExist(userId: Types.ObjectId) {
 const adminUser = await adminService.findAdminById(userId!);
    if (!adminUser) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Admin does not exist!",
          data: null,
        }),
      };
    }

     return {
      valid: true,
      adminUser,
    };


  }

//   static async doesUserExist(userId: Types.ObjectId, userRole: UserType) {
//     let user = null;

//     if (userRole === UserType.Owner) {
//       user = await userService.findUserByIdWithoutPassword(userId!);
//     }

//     if (userRole === UserType.Staff) {
//       user = await staffService.findStaffById(userId!.toString());
//     }
    
//     if (!user) {
//       return {
//         valid: false,
//         response: utils.customResponse({
//           status: 404,
//           message: MessageResponse.Error,
//           description: "User does not exist!",
//           data: null,
//         }),
//       };
//     }

//     return {
//       valid: true,
//       user,
//     };
//   }
}
