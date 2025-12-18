import { Types } from "mongoose";
import User from "./entity";
import { IUserSignUp } from "./interface";

class UserService {

  public async findUserByEmail(email: string) {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    return user;
  }

  public async createUser(userData: IUserSignUp) {
    // Clean phone number: remove formatting and ensure E.164 format
    let cleanedPhoneNumber = userData.phoneNumber?.trim() || '';
    if (cleanedPhoneNumber) {
      // Remove all formatting characters (spaces, hyphens, parentheses, dots)
      cleanedPhoneNumber = cleanedPhoneNumber.replace(/[\s\-\(\)\.]/g, '');
      // Ensure it starts with +
      if (!cleanedPhoneNumber.startsWith('+')) {
        cleanedPhoneNumber = '+' + cleanedPhoneNumber;
      }
    }

    const user = new User({
      ...userData,
      email: userData.email.toLowerCase().trim(),
      phoneNumber: cleanedPhoneNumber,
      isEmailVerified: false,
      otp: null,
      otpExpiry: null,
    });

    await user.save();

    // Return user without password
    const userObject = user.toObject();
    const { password, ...userWithoutPassword } = userObject;

    return userWithoutPassword;
  }

  public async userExists(email: string): Promise<boolean> {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    return !!user;
  }

  public async getUserById(userId: Types.ObjectId) {
    const user = await User.findById(userId).select("-password -otp -otpExpiry");
    
    if (!user) {
      return null;
    }

    // Return user without password and sensitive fields
    const userObject = user.toObject();
    const { password, otp, otpExpiry, ...userWithoutSensitiveData } = userObject;

    return userWithoutSensitiveData;
  }

  public async updatePersonalInfo(
    userId: Types.ObjectId,
    updateData: { firstName: string; lastName: string; phoneNumber: string }
  ) {
    // Clean phone number: remove formatting and ensure E.164 format
    let cleanedPhoneNumber = updateData.phoneNumber?.trim() || '';
    if (cleanedPhoneNumber) {
      // Remove all formatting characters (spaces, hyphens, parentheses, dots)
      cleanedPhoneNumber = cleanedPhoneNumber.replace(/[\s\-\(\)\.]/g, '');
      // Ensure it starts with +
      if (!cleanedPhoneNumber.startsWith('+')) {
        cleanedPhoneNumber = '+' + cleanedPhoneNumber;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName: updateData.firstName.trim(),
        lastName: updateData.lastName.trim(),
        phoneNumber: cleanedPhoneNumber,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -otp -otpExpiry");

    if (!user) {
      return null;
    }

    // Return user without password and sensitive fields
    const userObject = user.toObject();
    const { password, otp, otpExpiry, ...userWithoutSensitiveData } = userObject;

    return userWithoutSensitiveData;
  }

  public async updateAddress(
    userId: Types.ObjectId,
    updateData: { street: string; city: string; state: string; zipCode: string; country: string }
  ) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        street: updateData.street?.trim() || '',
        city: updateData.city?.trim() || '',
        state: updateData.state?.trim() || '',
        zipCode: updateData.zipCode?.trim() || '',
        country: updateData.country?.trim() || '',
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -otp -otpExpiry");

    if (!user) {
      return null;
    }

    // Return user without password and sensitive fields
    const userObject = user.toObject();
    const { password, otp, otpExpiry, ...userWithoutSensitiveData } = userObject;

    return userWithoutSensitiveData;
  }

  public async fetchUsers(
    page: number,
    limit: number,
    filters: { searchTerm?: string; status?: string }
  ) {
    const query: Record<string, any> = {};

    // Apply status filter
    if (filters.status && filters.status !== "all") {
      if (filters.status === "active") {
        query.isEmailVerified = true;
      } else if (filters.status === "pending" || filters.status === "inactive") {
        // Treat both pending and inactive as not verified for now (no explicit inactive flag)
        query.isEmailVerified = false;
      }
    }

    // Apply search filter (email, first name, last name, phone)
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchRegex = new RegExp(filters.searchTerm.trim(), "i");
      query.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "-password -otp -otpExpiry -passwordResetToken -passwordResetExpiry -emailVerificationToken -emailVerificationTokenExpiry"
        )
        .lean(),
      User.countDocuments(query),
    ]);

    const sanitizedUsers = users.map((user) => {
      const status = user.isEmailVerified ? "active" : "pending";
      return {
        _id: user._id?.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || "",
        street: user.street || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        country: user.country || "",
        isEmailVerified: !!user.isEmailVerified,
        status,
        // Placeholder metrics (can be enriched later)
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

export const userService = new UserService();
