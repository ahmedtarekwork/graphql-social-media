// utils
import handleConnectDB from "@/lib/handleConnectDB";

// types
import type { APIContextFnType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Story from "../../../../_models/story.model";

const getAuthUserStories = async (
  _: unknown,
  __: unknown,
  { req }: APIContextFnType
) =>
  await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while getting your stories",
    async resolveCallback(user) {
      const stories = await Story.find({ owner: user._id });

      if (!stories) {
        throw new GraphQLError(
          "something went wrong while getting your stories",
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
export default getAuthUserStories;
