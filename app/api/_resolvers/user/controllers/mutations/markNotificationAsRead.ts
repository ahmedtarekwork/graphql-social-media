// types
import type { APIContextFnType } from "@/lib/types";

// models
import User from "../../../../_models/user.model";

// utils
import handleConnectDB from "@/lib/handleConnectDB";

const markNotificationAsRead = async (
  _: unknown,
  { id }: { id: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while mark this notification as read",
    async resolveCallback(user) {
      await User.updateOne(
        { _id: user._id },
        { $set: { "notifications.$[item].hasRead": true } },
        { arrayFilters: [{ "item._id": id }] }
      );
      return { message: "notification marked as read", id };
    },
  });
};

export default markNotificationAsRead;
