import { prisma } from "../index";
import type { SDKUserData } from "./types";
import { APP_ROLES } from "./constants";

/**
 * Sync or create user from SDK authentication data
 * This ensures user data is stored in the database
 *
 * IMPORTANT: User's base role should only be set during login/authentication.
 * During workspace events, we should NOT update the user's role field.
 * Workspace membership roles are stored separately in WorkspaceMember model.
 *
 * @param sdkUserData - User data from SDK
 * @param updateRole - Whether to update the user's role (default: false, only true during login)
 */
export const syncUser = async (sdkUserData: SDKUserData, updateRole: boolean = false) => {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { sdkUserId: sdkUserData.id },
    });

    if (existingUser) {
      // Update existing user - only update role if explicitly allowed (during login)
      const updateData: {
        email?: string;
        name?: string;
        image?: string;
        role?: string;
        lastLoginAt: Date;
        updatedAt: Date;
      } = {
        email: sdkUserData.email || undefined,
        name: sdkUserData.name || undefined,
        image: sdkUserData.image || undefined,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      };

      // Only update role if explicitly allowed (during login)
      if (updateRole && sdkUserData.role) {
        updateData.role = sdkUserData.role;
      }

      const user = await prisma.user.update({
        where: { sdkUserId: sdkUserData.id },
        data: updateData,
      });

      return { success: true, user };
    } else {
      // Create new user - set role to USER by default if not provided
      const user = await prisma.user.create({
        data: {
          sdkUserId: sdkUserData.id,
          email: sdkUserData.email || `user-${sdkUserData.id}@example.com`,
          name: sdkUserData.name,
          image: sdkUserData.image,
          role: sdkUserData.role || APP_ROLES.USER, // Default to USER if not provided
          lastLoginAt: new Date(),
        },
      });

      return { success: true, user };
    }
  } catch (error) {
    console.error("Error syncing user:", error);
    return { success: false, error: "Failed to sync user" };
  }
};
