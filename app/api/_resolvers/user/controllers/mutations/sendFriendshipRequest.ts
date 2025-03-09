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

const sendFriendshipRequest = async (
  _: unknown,
  { userId }: { userId: string },
  { req }: APIContextFnType
) => {
  if (!userId) {
    throw new GraphQLError("user id is required to send request to him", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while send a friendship request to the user",
    async resolveCallback(user) {
      if (user._id === userId) {
        throw new GraphQLError(
          "you can't send friendship request to your self",
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

      if (isUserFriend) {
        throw new GraphQLError("user is already in your friends list", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      await User.updateOne(
        { _id: userId },
        {
          $push: {
            friendsRequests: user._id,

            notifications: {
              icon: "friend",
              content: `${user.username} sent a friendship request to you.`,
              url: "/friends/requests",
            },
          },
        }
      );

      return {
        message: "friendship request sent successfully",
      };
    },
  });
};

export default sendFriendshipRequest;
