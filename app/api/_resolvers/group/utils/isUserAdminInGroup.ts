import { Types } from "mongoose";

import Group from "../../../_models/group.model";

const isUserAdminInGroup = async (userId: string, groupId: string) => {
  const isUserAdminInGroup = await Group.aggregate([
    { $match: { _id: new Types.ObjectId(groupId) } },
    {
      $project: {
        isUserAdminInGroup: {
          $in: [new Types.ObjectId(userId), "$admins"],
        },
      },
    },
    { $match: { isUserAdminInGroup: true } },
  ]);

  return !!isUserAdminInGroup?.[0]?.isUserAdminInGroup;
};
export default isUserAdminInGroup;
