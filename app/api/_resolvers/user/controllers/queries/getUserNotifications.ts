// types
import type { APIContextFnType, Pagination } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import User from "../../../../_models/user.model";

const getUserNotifications = async (
  _: unknown,
  {
    notificationsPagination: { page, limit },
  }: { notificationsPagination: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "somehting went wrong while getting your notifications",

    async resolveCallback(user) {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(user._id) } },
        {
          $facet: {
            notificationsCount: [
              {
                $project: {
                  notificationsCount: {
                    $size: "$notifications",
                  },
                },
              },
            ],

            notificaitons: [
              { $unwind: "$notifications" },
              { $sort: { "notifications.createdAt": -1 } },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $group: {
                  _id: "$_id",
                  notifications: { $push: "$notifications" },
                },
              },
            ],
          },
        },
      ]);

      const notifications =
        result?.[0]?.notificaitons?.[0]?.notifications || [];
      const notificationsCount =
        result?.[0]?.notificationsCount?.[0]?.notificationsCount || 0;

      return {
        notifications,
        isFinalPage: page * limit >= notificationsCount,
      };
    },
  });
};

export default getUserNotifications;
