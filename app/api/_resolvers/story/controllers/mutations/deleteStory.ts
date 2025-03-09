// models
import Story from "../../../../_models/story.model";

// types
import type { APIContextFnType } from "@/lib/types";

// gql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";

const deleteStory = async (
  _: unknown,
  { storyId }: { storyId: string },
  { req }: APIContextFnType
) => {
  if (!storyId) {
    throw new GraphQLError("story id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while deleting the story",
    async resolveCallback(user) {
      const story = (await Story.findById(storyId))?._doc;

      if (!story) {
        throw new GraphQLError("story with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (story.owner.toString() !== user._id) {
        throw new GraphQLError("you aren't the owner of the story", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      await Story.deleteOne({ _id: storyId });

      deleteMedia([story.media.public_id]);

      return { message: "story deleted successfully" };
    },
  });
};

export default deleteStory;
