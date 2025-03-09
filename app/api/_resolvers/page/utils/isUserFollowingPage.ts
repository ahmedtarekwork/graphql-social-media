// utils
import { Types } from "mongoose";

// models
import Page from "../../../_models/page.model";

const isUserFollowingPage = async (userId: string, pageId: string) => {
  const isUserFollowingPage = await Page.aggregate([
    { $match: { _id: new Types.ObjectId(pageId) } },
    {
      $project: {
        isUserFollowingPage: {
          $in: [new Types.ObjectId(userId), "$admins"],
        },
      },
    },
    { $match: { isUserFollowingPage: true } },
  ]);

  return !!isUserFollowingPage?.[0]?.isUserFollowingPage;
};

export default isUserFollowingPage;
