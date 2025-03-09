// models
import User from "../../../../_models/user.model";

// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { GraphQLError } from "graphql";

const getSingleUser = async (_: unknown, { userId }: { userId: string }) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting user info",
    async resolveCallback() {
      const user = await User.findById(userId).select(
        "_id username profilePicture coverPicture email address"
      );

      if (!user) {
        throw new GraphQLError("user with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return user;
    },
  });
};

export default getSingleUser;
