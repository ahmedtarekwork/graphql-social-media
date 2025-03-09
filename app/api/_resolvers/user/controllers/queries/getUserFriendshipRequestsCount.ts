// models
import User from "../../../../_models/user.model";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// types
import type { APIContextFnType } from "@/lib/types";

const getUserFriendshipRequestsCount = async (
  _: unknown,
  __: unknown,
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while getting the friendship requests count",

    async resolveCallback(authUser) {
      const count = await User.aggregate([
        { $match: { _id: new Types.ObjectId(authUser._id) } },
        {
          $project: {
            friendsRequests: {
              $size: "$friendsRequests",
            },
          },
        },
      ]);

      return { count: count[0].friendsRequests };
    },
  });
};

export default getUserFriendshipRequestsCount;
