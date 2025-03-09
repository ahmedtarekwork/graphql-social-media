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

const handleFriendShipRequest = async (
  _: unknown,
  {
    handleFriendshipRequestData: { userId, acception },
  }: {
    handleFriendshipRequestData: { userId: string; acception: boolean };
  },
  { req }: APIContextFnType
) => {
  if (!userId) {
    throw new GraphQLError("user id is required to send request to him", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (typeof acception !== "boolean") {
    throw new GraphQLError("you must accept or denied the friendship request", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while accept or denied the friendship request",
    async resolveCallback(user) {
      if (user._id === userId) {
        throw new GraphQLError(
          "you can't make friendship request to your self",
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

      if (acception) {
        const adduserToFriendsListOfSender = User.updateOne(
          { _id: userId },
          {
            $push: {
              friendsList: user._id,
            },
          }
        );

        const addSenderToFriendsListAndRemoveRequest = User.updateOne(
          {
            _id: user._id,
          },
          {
            $pull: { friendsRequests: userId },
            $push: {
              friendsList: userId,
            },
          }
        );

        const response = await Promise.allSettled([
          adduserToFriendsListOfSender,
          addSenderToFriendsListAndRemoveRequest,
        ]);

        if (response.every((res) => res.status === "fulfilled")) {
          const notification = {
            content: `${user.username} accepted your friendship request, you are now friends.`,
            icon: "friend",
            url: "/friends",
          };

          await User.updateOne(
            { _id: userId },
            {
              $push: {
                notifications: notification,
              },
            }
          );

          return {
            message: "request accepted, you are now friends",
            id: userId,
          };
        }

        throw new GraphQLError(
          "something went wrong while accepting the friendship request",
          {
            extensions: {
              code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
            },
          }
        );
      }

      await User.updateOne(
        { _id: user._id },
        { $pull: { friendsRequests: userId } }
      );

      return {
        message: "you denied the friendship request",
        id: userId,
      };
    },
  });
};

export default handleFriendShipRequest;
