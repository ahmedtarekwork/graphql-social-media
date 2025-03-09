// models
import Story from "../../../../_models/story.model";

// types
import type { APIContextFnType, ImageType } from "@/lib/types";

// gql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";

const addStory = async (
  _: unknown,
  {
    addStoryData: { caption, media },
  }: {
    addStoryData: {
      caption: string;
      media: ImageType;
    };
  },
  { req }: APIContextFnType
) => {
  if (!caption && !media) {
    throw new GraphQLError(
      "you must provide media or some text to make the story",
      { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
    );
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while make the story",
    async resolveCallback(user) {
      const story = await Story.create({
        caption,
        media,
        owner: user._id,
      });

      return story;
    },
  });
};

export default addStory;
