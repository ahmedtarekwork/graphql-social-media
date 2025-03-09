// types
import type { APIContextFnType } from "@/lib/types";
// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserFriendFn from "../../utils/isUserFriend";

// models
import User from "../../../../_models/user.model";

const removeUserFromFriendsList = async (
  _: unknown,
  { userId }: { userId: string },
  { req }: APIContextFnType
) => {
  if (!userId) {
    throw new GraphQLError(
      "user id is required to remove him from your friends list",
      {
        extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
      }
    );
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while remove the user from your friends list",
    async resolveCallback(user) {
      if (user._id === userId) {
        throw new GraphQLError(
          "you can't add or remove your self from your friends list",
          {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          }
        );
      }

      if (!(await User.exists({ _id: userId }))) {
        throw new GraphQLError("user with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserFriend = await isUserFriendFn(user._id, userId);

      if (!isUserFriend) {
        throw new GraphQLError("user is already not a friend", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      await Promise.allSettled([
        User.updateOne(
          { _id: user._id },
          {
            $pull: {
              friendsList: userId,
            },
          }
        ),

        User.updateOne(
          { _id: userId },
          {
            $pull: {
              friendsList: user._id,
            },
          }
        ),
      ]);

      return {
        message: "user removed from your friends successfully",
        userId,
      };
    },
  });
};

export default removeUserFromFriendsList;
