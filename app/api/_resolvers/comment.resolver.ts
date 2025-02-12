// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";

import checkForPostPrivacy, {
  checkForPrivacy,
} from "@/lib/checkForPostPrivacy";

import { Types } from "mongoose";

// constants
import { flatReactions } from "@/constants/reactions";

// models
import Post from "../_models/post.model";
import Comment from "../_models/comment.model";

// types
import type {
  APIContextFnType,
  CommentType,
  ImageType,
  Pagination,
  ReactionsType,
} from "@/lib/types";

const commentResolvers = {
  Query: {
    getPostComments: async (
      _: unknown,
      {
        commentData: { postId, page = 1, limit = 0, skip = 0 },
      }: { commentData: Pagination<{ postId: string; skip: number }> }
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting comments",
        async resolveCallback() {
          const mainSkip = limit * (page - 1);
          const commentsPromise = Comment.find({ post: postId })
            .lean()
            .select({
              "reactions.like.count": 1,
              "reactions.love.count": 1,
              "reactions.sad.count": 1,
              "reactions.angry.count": 1,
              comment: 1,
              media: 1,
              privacy: 1,
              community: 1,
              createdAt: 1,
            })
            .sort("-createdAt")
            .populate({ path: "owner", select: "_id username profilePicture" })
            .limit(limit)
            .skip(mainSkip + skip);

          const commentsCountPromise = Comment.countDocuments({ post: postId });

          const [comments, commentsCount] = await Promise.allSettled([
            commentsPromise,
            commentsCountPromise,
          ]);

          if (
            [comments, commentsCount].some((res) => res.status === "rejected")
          ) {
            throw new GraphQLError(
              "can't get this post comments at the momment",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          return {
            comments:
              (comments as unknown as { value: CommentType[] })?.value || [],
            isFinalPage:
              page * limit >=
              ((commentsCount as { value: number })?.value || 0),
          };
        },
      }),

    getSingleComment: async (
      _: unknown,
      { commentId }: { commentId: string }
    ) =>
      handleConnectDB({
        publicErrorMsg: "something went wrong while getting the comment",
        async resolveCallback() {
          const comment = await Comment.findById(commentId)
            .populate({ path: "owner", select: "_id username profilePicture" })
            .lean()
            .select({
              "reactions.like.count": 1,
              "reactions.love.count": 1,
              "reactions.sad.count": 1,
              "reactions.angry.count": 1,
              comment: 1,
              media: 1,
              privacy: 1,
              community: 1,
              createdAt: 1,
            });

          if (!comment) {
            throw new GraphQLError("comment with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          return comment;
        },
      }),

    getCommentReactions: async (
      _: unknown,
      {
        reactionsInfo: {
          itemId: commentId,
          limit = 0,
          page = 1,
          reaction = "like",
        },
      }: {
        reactionsInfo: Pagination<{
          itemId: string;
          reaction: keyof ReactionsType;
        }>;
      }
    ) => {
      return await handleConnectDB({
        publicErrorMsg: "can't get comment reactions at the momment",
        async resolveCallback() {
          if (!commentId) {
            throw new GraphQLError("comment id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const result = await Comment.aggregate([
            { $match: { _id: new Types.ObjectId(commentId) } },
            {
              $facet: {
                reactionsCount: [
                  {
                    $project: {
                      reactionsCount: {
                        $size: `$reactions.${reaction}.users`,
                      },
                    },
                  },
                ],

                reactions: [
                  { $unwind: `$reactions.${reaction}.users` },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },
                  {
                    $lookup: {
                      from: "users",
                      localField: `reactions.${reaction}.users`,
                      foreignField: "_id",
                      as: "userInfo",
                    },
                  },

                  {
                    $unwind: "$userInfo",
                  },

                  {
                    $project: {
                      _id: 0,
                      userInfo: {
                        _id: 1,
                        username: 1,
                        profilePicture: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      reactions: { $push: "$userInfo" },
                    },
                  },
                ],
              },
            },
          ]);

          const reactions = result?.[0]?.reactions?.[0]?.reactions || [];

          const reactionsCount =
            result?.[0]?.reactionsCount?.[0]?.reactionsCount || 0;

          return {
            isFinalPage: page * limit >= reactionsCount,
            reactions,
          };
        },
      });
    },

    getMyReactionToComment: async (
      _: unknown,
      { itemId: commentId }: { itemId: string },
      { req }: APIContextFnType
    ) => {
      return await handleConnectDB({
        publicErrorMsg:
          "can't get your reaction to this comment at the momment",
        validateToken: true,
        req,
        async resolveCallback(user) {
          if (!commentId) {
            throw new GraphQLError("comment id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const result = await Comment.aggregate([
            { $match: { _id: new Types.ObjectId(commentId) } },
            {
              $facet: {
                like: [
                  {
                    $project: {
                      like: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.like.users",
                        ],
                      },
                    },
                  },
                  { $match: { like: true } },
                ],
                love: [
                  {
                    $project: {
                      love: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.love.users",
                        ],
                      },
                    },
                  },
                  { $match: { love: true } },
                ],
                sad: [
                  {
                    $project: {
                      sad: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.sad.users",
                        ],
                      },
                    },
                  },
                  { $match: { sad: true } },
                ],
                angry: [
                  {
                    $project: {
                      angry: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.angry.users",
                        ],
                      },
                    },
                  },
                  { $match: { angry: true } },
                ],
              },
            },
          ]);

          return {
            reaction: Object.entries(result?.[0]).find(([key, value]) => {
              return (value as Record<string, unknown>[])?.[0]?.[key];
            })?.[0],
          };
        },
      });
    },
  },

  Mutation: {
    addComment: async (
      _: unknown,
      {
        addCommentData: { postId, comment, media },
      }: {
        addCommentData: {
          postId: string;
          comment: string;
          media?: ImageType[];
        };
      },
      { req }: APIContextFnType
    ) => {
      if (!postId) {
        throw new GraphQLError("post id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!comment && (!media || !media?.length)) {
        throw new GraphQLError("comment can't be empty", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while publishing the comment",
        async resolveCallback(user) {
          const post = await checkForPostPrivacy(postId, user._id);
          if (post instanceof GraphQLError) throw post;

          if (post.blockComments) {
            throw new GraphQLError("owner of the post block comments", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          const addComment = await Comment.create({
            post: postId,
            comment,
            media: media || [],
            owner: user._id,
            community: post.community,
            communityId: post.communityId,
          });

          console.log("addComment", addComment);
          console.log("addComment._doc", addComment._doc);

          await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

          return { ...addComment._doc, owner: user };
        },
      });
    },
    editComment: async (
      _: unknown,
      {
        editCommentData: { commentId, comment, media },
      }: {
        editCommentData: {
          commentId: string;
          comment?: string;
          media?: ImageType[];
        };
      },
      { req }: APIContextFnType
    ) => {
      if (!commentId) {
        throw new GraphQLError("comment id is required to update it", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!comment && !media?.length) {
        throw new GraphQLError(
          "you must provide some data to update the comment",
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }

      return await handleConnectDB({
        publicErrorMsg: "something went wrong while update the comment",
        validateToken: true,
        req,
        async resolveCallback(user) {
          const oldComment = await Comment.findById(commentId).populate("post");

          if (!oldComment) {
            throw new GraphQLError("comment with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          if (!oldComment.post) {
            throw new GraphQLError("post was deleted", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const privacyChecker = checkForPrivacy(oldComment.post, user._id);
          if (privacyChecker instanceof GraphQLError) throw privacyChecker;

          if (oldComment.owner.toString() !== user._id) {
            throw new GraphQLError("you can't edit other users comments");
          }

          const updatedData = {} as Record<string, unknown>;

          if (comment) {
            if (oldComment.comment === comment && !media?.length) {
              throw new GraphQLError("you can't update comment with same", {
                extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
              });
            }

            if (oldComment.comment !== comment) {
              updatedData.$set = {
                comment,
              };
            }
          }

          if (media?.length) {
            updatedData.$push = {
              media,
            };
          }

          await Comment.updateOne({ _id: commentId }, updatedData);

          return { message: "comment updated successfully" };
        },
      });
    },
    deleteComment: async (
      _: unknown,
      { commentId }: { commentId: string },
      { req }: APIContextFnType
    ) => {
      if (!commentId) {
        throw new GraphQLError("comment id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while deleting the comment",
        async resolveCallback(user) {
          const comment = (await Comment.findById(commentId).populate("post"))
            ._doc;

          if (!comment) {
            throw new GraphQLError("comment with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const privacyChecker = checkForPrivacy(comment.post._doc, user._id);
          if (privacyChecker instanceof GraphQLError) throw privacyChecker;

          if (comment.owner.toString() !== user._id) {
            throw new GraphQLError("you can't delete other users comments");
          }

          await Comment.deleteOne({ _id: commentId });

          await Promise.allSettled([
            Post.updateOne(
              { _id: comment.post._doc._id },
              {
                $inc: { commentsCount: -1 },
              }
            ),
            deleteMedia(
              comment.media.map((media: ImageType) => media.public_id)
            ),
          ]);

          return { message: "comment deleted successfully" };
        },
      });
    },
    deleteMediaFromComment: async (
      _: unknown,
      {
        mediaData: { itemId: commentId, publicIds },
      }: { mediaData: { itemId: string; publicIds: string[] } },
      { req }: APIContextFnType
    ) => {
      if (!commentId) {
        throw new GraphQLError("comment id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!publicIds?.length) {
        throw new GraphQLError("you need to select some media to delete", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while delete media from comment",
        async resolveCallback(user) {
          const oldComment = (
            await Comment.findById(commentId).populate("post")
          )?._doc;

          if (!commentId) {
            throw new GraphQLError("comment with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const privacyChecker = checkForPrivacy(
            oldComment.post._doc,
            user._id
          );
          if (privacyChecker instanceof GraphQLError) throw privacyChecker;

          if (oldComment.owner.toString() !== user._id) {
            throw new GraphQLError("you can't delete other users comments");
          }

          await Promise.allSettled([
            deleteMedia(publicIds),

            Comment.updateOne(
              { _id: commentId },
              {
                $pull: {
                  media: {
                    $or: publicIds.map((id) => ({ public_id: id })),
                  },
                },
              }
            ),
          ]);

          return { message: "media deleted successfully from the comment" };
        },
      });
    },
    toggleReactionOnComment: async (
      _: unknown,
      {
        reactionData: { itemId: commentId, reaction },
      }: { reactionData: { itemId: string; reaction: keyof ReactionsType } },
      { req }: APIContextFnType
    ) => {
      if (!commentId) {
        throw new GraphQLError("comment id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!reaction) {
        throw new GraphQLError("you need to provide a reaction", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!flatReactions.includes(reaction)) {
        throw new GraphQLError(
          "reaction must be one of this types [like, love, sad, angry]"
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while update the reaction",
        async resolveCallback(user) {
          const comment = (
            await Comment.findById(commentId).populate({
              path: "post",
              select: "_id privacy owner",
            })
          )?._doc;

          const privacyChecker = checkForPrivacy(comment.post._doc, user._id);
          if (privacyChecker instanceof GraphQLError) throw privacyChecker;

          const oldUserReactionPromise = await Comment.aggregate([
            { $match: { _id: new Types.ObjectId(commentId) } },
            {
              $facet: {
                like: [
                  {
                    $project: {
                      like: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.like.users",
                        ],
                      },
                    },
                  },
                  { $match: { like: true } },
                ],
                love: [
                  {
                    $project: {
                      love: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.love.users",
                        ],
                      },
                    },
                  },
                  { $match: { love: true } },
                ],
                sad: [
                  {
                    $project: {
                      sad: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.sad.users",
                        ],
                      },
                    },
                  },
                  { $match: { sad: true } },
                ],
                angry: [
                  {
                    $project: {
                      angry: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.angry.users",
                        ],
                      },
                    },
                  },
                  { $match: { angry: true } },
                ],
              },
            },
          ]);

          const oldUserReaction = Object.entries(
            oldUserReactionPromise?.[0]
          ).find(([key, value]) => {
            return !!(value as unknown as Record<string, boolean>[])?.[0]?.[
              key
            ];
          })?.[0];

          const modifyData = {
            $inc: {
              [`reactions.${reaction}.count`]:
                oldUserReaction === reaction ? -1 : 1,
            },

            [`$${oldUserReaction === reaction ? "pull" : "push"}`]: {
              [`reactions.${reaction}.users`]: user._id,
            },
          } as Record<string, unknown>;

          if (oldUserReaction && oldUserReaction !== reaction) {
            modifyData["$inc"] = {
              ...(modifyData["$inc"] as Record<string, unknown>),
              [`reactions.${oldUserReaction}.count`]: -1,
            };

            modifyData["$pull"] = {
              ...(modifyData["$pull"] as Record<string, unknown>),
              [`reactions.${oldUserReaction}.users`]: user._id,
            };
          }

          await Comment.updateOne({ _id: commentId }, modifyData);

          return { message: "reaction updated successfully" };
        },
      });
    },
  },
};

export default commentResolvers;
