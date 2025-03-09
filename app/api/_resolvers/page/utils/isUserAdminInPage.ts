// utils
import { Types } from "mongoose";

// models
import Page from "../../../_models/page.model";

const isUserAdminInPage = async (userId: string, pageId: string) => {
  const isUserAdminInPage = await Page.aggregate([
    { $match: { _id: new Types.ObjectId(pageId) } },
    {
      $project: {
        isUserAdminInPage: {
          $in: [new Types.ObjectId(userId), "$admins"],
        },
      },
    },
    { $match: { isUserAdminInPage: true } },
  ]);

  return !!isUserAdminInPage?.[0]?.isUserAdminInPage;
};

export default isUserAdminInPage;
