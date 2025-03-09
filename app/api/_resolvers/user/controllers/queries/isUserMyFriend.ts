// types
import type { APIContextFnType } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserFriend from "../../utils/isUserFriend";

const isUserMyFriend = async (
  _: unknown,
  { userId }: { userId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong",
    async resolveCallback(user) {
      const status = await isUserFriend(userId, user._id);

      return { status };
    },
  });
};

export default isUserMyFriend;
