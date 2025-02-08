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

// models
import Post from "../_models/post.model";
import Comment from "../_models/comment.model";

// types
import type {
  APIContextFnType,
  ImageType,
  Pagination,
  ReactionsType,
} from "@/lib/types";

const commentResolvers = {
  Query: {
    getPostComments: async (
      _: unknown,
      {
        commentData: { postId, page = 1, limit = 0 },
      }: { commentData: Pagination<{ postId: string }> }
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting comments",
        async resolveCallback() {
          return await Comment.find({ postId })
            .sort("-createdAt")
            .populate({ path: "owner", select: "_id username profilePicture" })
            .limit(limit)
            .skip(limit * (page - 1));
        },
      }),

    getSingleComment: async (
      _: unknown,
      { commentId }: { commentId: string }
    ) =>
      handleConnectDB({
        publicErrorMsg: "something went wrong while getting the comment",
        async resolveCallback() {
          const comment = await Comment.findById(commentId).populate("owner");

          if (!comment) {
            throw new GraphQLError("comment with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          return comment;
        },
      }),
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
        publicErrorMsg: "something went wrong while posting the comment",
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
            if (oldComment.comment === comment) {
              throw new GraphQLError("you can't update comment with same", {
                extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
              });
            }

            updatedData.$set = {
              comment,
            };
          }

          if (media?.length) {
            updatedData.$push = {
              media,
            };
          }

          const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            updatedData,
            { new: true }
          );

          if (!updatedComment) {
            throw new GraphQLError(
              "something went wrong while updating the comment",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          return { ...updatedComment._doc, owner: user };
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

          const updatePostCommentsCount = Post.updateOne(
            { _id: comment.post._doc._id },
            {
              $inc: { commentsCount: -1 },
            }
          );

          await Promise.allSettled([
            updatePostCommentsCount,
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

          const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
              $pull: {
                media: {
                  $or: publicIds.map((id) => ({ public_id: id })),
                },
              },
            },
            { new: true }
          );

          await deleteMedia(publicIds);

          return { ...updatedComment._doc, owner: user };
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

      if (!["like", "love", "sad", "angry"].includes(reaction)) {
        throw new GraphQLError(
          "reaction must be one of this types [like, love, sad, angry]"
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while update the reaction",
        async resolveCallback(user) {
          const comment = (await Comment.findById(commentId).populate("post"))
            ?._doc;

          const privacyChecker = checkForPrivacy(comment.post._doc, user._id);
          if (privacyChecker instanceof GraphQLError) throw privacyChecker;

          const oldUserReaction = Object.entries(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (comment.reactions as any)._doc
          ).find(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ([_, reactData]) =>
              (reactData as { users: (typeof Types.ObjectId)[] }).users.some(
                (id) => id.toString() === user._id
              )
          );

          const modifyData = {
            $inc: {
              [`reactions.${reaction}.count`]:
                oldUserReaction?.[0] === reaction ? -1 : 1,
            },

            [`$${oldUserReaction?.[0] === reaction ? "pull" : "push"}`]: {
              [`reactions.${reaction}.users`]: user._id,
            },
          } as Record<string, unknown>;

          if (oldUserReaction?.[0] && oldUserReaction[0] !== reaction) {
            modifyData["$inc"] = {
              ...(modifyData["$inc"] as Record<string, unknown>),
              [`reactions.${oldUserReaction[0]}.count`]: -1,
            };

            modifyData["$pull"] = {
              ...(modifyData["$pull"] as Record<string, unknown>),
              [`reactions.${oldUserReaction[0]}.users`]: user._id,
            };
          }

          const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            modifyData,
            {
              new: true,
            }
          ).populate({
            path: "reactions.like.users reactions.love.users reactions.angry.users reactions.sad.users",
            select: "username profilePicture",
          });

          return { ...updatedComment._doc, owner: user };
        },
      });
    },
  },
};

export default commentResolvers;
