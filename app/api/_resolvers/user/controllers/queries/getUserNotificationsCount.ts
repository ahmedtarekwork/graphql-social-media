// models
import User from "../../../../_models/user.model";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// types
import type { APIContextFnType } from "@/lib/types";

const getUserNotificationsCount = async (
  _: unknown,
  __: unknown,
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while getting the notifications count",
    async resolveCallback(authUser) {
      const count = await User.aggregate([
        { $match: { _id: new Types.ObjectId(authUser._id) } },
        {
          $project: {
            notifications: {
              $size: {
                $filter: {
                  input: "$notifications",
                  as: "item",
                  cond: { $eq: ["$$item.hasRead", false] },
                },
              },
            },
          },
        },
      ]);

      return { count: count?.[0]?.notifications || 0 };
    },
  });
};

export default getUserNotificationsCount;
