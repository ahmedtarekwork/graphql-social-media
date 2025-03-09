// types
import type { APIContextFnType } from "@/lib/types";

// models
import User from "../../../../_models/user.model";

// utils
import handleConnectDB from "@/lib/handleConnectDB";

const markAllNotificationsAsRead = async (
  _: unknown,
  __: unknown,
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while mark all notifications as read",
    async resolveCallback(user) {
      await User.updateOne(
        { _id: user._id },
        { $set: { "notifications.$[].hasRead": true } }
      );
      return { message: "all notifications marked as read" };
    },
  });
};

export default markAllNotificationsAsRead;
