// utils
import { Types } from "mongoose";

// models
import User from "../../../_models/user.model";

const isUserFriend = async (userOne: string, userTwo: string) => {
  const isUserFriend = await User.aggregate([
    { $match: { _id: new Types.ObjectId(userOne) } },
    {
      $project: {
        isUserFriend: {
          $in: [new Types.ObjectId(userTwo), "$friendsList"],
        },
      },
    },
    { $match: { isUserFriend: true } },
  ]);

  return !!isUserFriend?.[0]?.isUserFriend;
};

export default isUserFriend;
