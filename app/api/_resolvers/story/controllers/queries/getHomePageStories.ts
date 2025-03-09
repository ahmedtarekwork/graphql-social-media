// types
import type { APIContextFnType, Pagination } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import handleConnectDB from "@/lib/handleConnectDB";

// models
import User from "../../../../_models/user.model";
import Story from "../../../../_models/story.model";

const getHomePageStories = async (
  _: unknown,
  {
    paginatedStories: { page = 1, limit = 0 },
  }: { paginatedStories: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while getting the stories",

    userQuery: (userId) => {
      return User.findById(userId).select("friendsList");
    },
    async resolveCallback(user) {
      const stories = await Story.find({
        owner: {
          $or: (user as unknown as { friendsList: (typeof Types.ObjectId)[] })
            .friendsList,
        },
      })
        .sort("-createdAt")
        .limit(limit)
        .skip(page - 1 * limit);

      if (!stories) {
        throw new GraphQLError(
          "something went wrong while getting the stories",
          {
            extensions: {
              code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
            },
          }
        );
      }

      return stories;
    },
  });
};

export default getHomePageStories;
