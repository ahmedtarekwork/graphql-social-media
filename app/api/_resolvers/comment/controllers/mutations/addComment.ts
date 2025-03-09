// utils
import checkForPostPrivacy from "@/lib/checkForPostPrivacy";
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Post from "../../../../_models/post.model";
import Comment from "../../../../_models/comment.model";

// types
import type { APIContextFnType, ImageType } from "@/lib/types";

const addComment = async (
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

      await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

      return { ...addComment._doc, owner: user };
    },
  });
};

export default addComment;
