// models
import Story from "../../../../_models/story.model";

// types
import type { APIContextFnType, ImageType } from "@/lib/types";

// gql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";

const updateStory = async (
  _: unknown,
  {
    updateStoryData: { storyId, caption, media },
  }: {
    updateStoryData: {
      caption: string;
      storyId: string;
      media: ImageType;
    };
  },
  { req }: APIContextFnType
) => {
  if (!storyId) {
    throw new GraphQLError("story id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (!caption && !media) {
    throw new GraphQLError(
      "you must provide media or some text to make the story",
      { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
    );
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while update the story",
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

      if (story.caption === caption) {
        throw new GraphQLError(
          "you can't update the caption with the same value",
          { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
        );
      }

      const newStoryData = (
        await Story.findByIdAndUpdate(
          storyId,
          {
            caption,
            media,
          },
          { new: true }
        )
      )?._doc;

      return newStoryData;
    },
  });
};

export default updateStory;
