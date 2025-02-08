// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";
import { Types } from "mongoose";

// models
import User from "../_models/user.model";
import Story from "../_models/story.model";

// types
import type { APIContextFnType, ImageType, Pagination } from "@/lib/types";

const storyResolvers = {
  Query: {
    getHomePageStories: async (
      _: unknown,
      {
        paginatedStories: { page = 1, limit = 0 },
      }: { paginatedStories: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while getting the stories",

        userQuery: (userId) => {
          return User.findById(userId).select("friendsList");
        },
        async resolveCallback(user) {
          const stories = await Story.find({
            owner: {
              $or: (
                user as unknown as { friendsList: (typeof Types.ObjectId)[] }
              ).friendsList,
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
      }),

    getAuthUserStories: async (
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
      }),

    getSingleUserStories: async (_: unknown, { userId }: { userId: string }) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting this user stories",
        async resolveCallback() {
          if (!(await User.exists({ _id: userId }))) {
            throw new GraphQLError("user with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const stories = await Story.find({ owner: userId });

          if (!stories) {
            throw new GraphQLError(
              "something went wrong while getting this user stories"
            );
          }

          return stories;
        },
      }),
  },

  Mutation: {
    addStory: async (
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
    },

    updateStory: async (
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
    },

    deleteStory: async (
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
    },
  },
};

export default storyResolvers;
