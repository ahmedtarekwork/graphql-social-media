import { Types } from "mongoose";

import User from "../../../_models/group.model";

const isUserMemberInGroup = async (userId: string, groupId: string) => {
  const isUserMemberInGroup = await User.aggregate([
    { $match: { _id: new Types.ObjectId(userId) } },
    {
      $project: {
        isUserMemberInGroup: {
          $in: [new Types.ObjectId(groupId), "$joinedGroups"],
        },
      },
    },
    { $match: { isUserMemberInGroup: true } },
  ]);

  return !!isUserMemberInGroup?.[0]?.isUserMemberInGroup;
};
export default isUserMemberInGroup;
