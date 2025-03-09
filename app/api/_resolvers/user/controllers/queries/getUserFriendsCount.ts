// models
import User from "../../../../_models/user.model";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

const getUserFriendsCount = async (
  _: unknown,
  { userId }: { userId: string }
) => {
  return await handleConnectDB({
    publicErrorMsg: "can't get friends count at the momment",
    async resolveCallback() {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(userId) } },
        {
          $project: {
            friendsCount: {
              $size: "$friendsList",
            },
          },
        },
      ]);

      return { count: result?.[0]?.friendsCount || 0 };
    },
  });
};

export default getUserFriendsCount;
