// models
import User from "../../../../_models/user.model";

// types
import type { APIContextFnType } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

const doesCurrentUserRecevedFriendshipRequest = async (
  _: unknown,
  { senderId }: { senderId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong",
    async resolveCallback(user) {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(user._id) } },
        {
          $project: {
            friendshipRequestExists: {
              $in: [new Types.ObjectId(senderId), "$friendsRequests"],
            },
          },
        },
        { $match: { friendshipRequestExists: true } },
      ]);

      return { status: !!result?.[0]?.friendshipRequestExists };
    },
  });
};

export default doesCurrentUserRecevedFriendshipRequest;
