// types
import type { APIContextFnType, ImageType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserAdminInGroupFn from "../../../group/utils/isUserAdminInGroup";
import isUserAdminInPageFn from "../../../page/utils/isUserAdminInPage";
import { Types } from "mongoose";
import { deleteMedia } from "@/lib/utils";

// models
import Post from "../../../../_models/post.model";
import User from "../../../../_models/user.model";
import Comment from "../../../../_models/comment.model";

const deletePost = async (
  _: unknown,
  { postId }: { postId: string },
  { req }: APIContextFnType
) => {
  if (!postId) {
    throw new GraphQLError("post id must be provided", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while deleting the post",
    async resolveCallback(user) {
      const post = (
        await Post.findById(postId).populate({
          path: "communityId",
          select: "_id owner",
        })
      )?._doc;

      if (!post) {
        throw new GraphQLError("post with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      let hasAccess = false;

      switch (post.community) {
        case "personal": {
          hasAccess = post.owner.toString() === user._id;
        }

        default: {
          const isUserAdminInCommunity = await (post.community === "page"
            ? isUserAdminInPageFn
            : isUserAdminInGroupFn)(user._id, post.communityId._id);

          hasAccess =
            post.owner.toString() === user._id.toString() ||
            isUserAdminInCommunity ||
            post.communityId.owner.toString() === user._id.toString();
        }
      }

      if (!hasAccess) {
        throw new GraphQLError(
          `post owner${
            post.community !== "personal"
              ? ` or ${post.community} owner or admins`
              : ""
          } can only delete this post`,
          {
            extensions: { code: "FORBIDDEN" },
          }
        );
      }

      await Post.deleteOne({ _id: postId });

      const commentsMedia = await Comment.find({ post: postId }).select(
        "media"
      );

      const deleteCommentsPromise = () => Comment.deleteMany({ post: postId });

      const deleteFromUsersSavedPostsAndSharedPostsAndPostOwnerPosts = () =>
        User.updateMany(
          {
            $or: [
              { savedPosts: new Types.ObjectId(postId) },
              { "allPosts.post": new Types.ObjectId(postId) },
            ],
          },
          {
            $pull: {
              savedPosts: new Types.ObjectId(postId),
              allPosts: { post: new Types.ObjectId(postId) },
            },
          }
        );

      await Promise.allSettled([
        deleteFromUsersSavedPostsAndSharedPostsAndPostOwnerPosts(),
        deleteCommentsPromise(),
        deleteMedia([
          ...post.media.map((media: ImageType) => media.public_id),
          ...commentsMedia
            .map((comment) => comment.media)
            .map((mediaArr: ImageType[]) =>
              mediaArr.map((media) => media.public_id)
            )
            .flat(Infinity),
        ]),
      ]);

      return { message: "post deleted successfully" };
    },
  });
};

export default deletePost;
