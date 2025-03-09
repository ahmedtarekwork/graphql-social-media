// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import User from "../../../../_models/user.model";
import Page from "../../../../_models/page.model";
import Post from "../../../../_models/post.model";
import Comment from "../../../../_models/comment.model";

// utils
import { deleteMedia } from "@/lib/utils";
import handleConnectDB from "@/lib/handleConnectDB";

// types
import type { APIContextFnType } from "@/lib/types";

const deletePage = async (
  _: unknown,
  { pageId }: { pageId: string },
  { req }: APIContextFnType
) => {
  if (!pageId) {
    throw new GraphQLError("page id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while deleting the page",
    async resolveCallback(user) {
      const page = (
        await Page.findById(pageId).select("profilePicture coverPicture owner")
      )?._doc;

      if (!page) {
        throw new GraphQLError("page with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (user._id !== page.owner.toString()) {
        throw new GraphQLError(
          "page owner only have the ability to delete the page",
          {
            extensions: { code: "FORBIDDEN" },
          }
        );
      }

      await Page.deleteOne({ _id: pageId });

      const [postsMediaRes, commentsMediaRes] = await Promise.allSettled([
        Post.find({ communityId: pageId }).select("media"),
        Comment.find({ communityId: pageId }).select("media"),
      ]);

      const postsMedia =
        postsMediaRes.status === "fulfilled" ? postsMediaRes.value : [];
      const commentsMedia =
        commentsMediaRes.status === "fulfilled" ? commentsMediaRes.value : [];

      const removeOwnerFromPage = () =>
        User.updateOne({ _id: user._id }, { $pull: { ownedPages: pageId } });
      const removeAdminsFromPage = () =>
        User.updateMany(
          {
            adminPages: pageId,
          },
          {
            $pull: {
              adminPages: pageId,
            },
          }
        );
      const removeFollowersFromPage = () =>
        User.updateMany(
          {
            followedPages: pageId,
          },
          {
            $pull: {
              followedPages: pageId,
            },
          }
        );

      const removePagePosts = () => Post.deleteMany({ communityId: pageId });
      const removePageComments = () =>
        Comment.deleteMany({
          communityId: pageId,
        });

      const promisesArr: (() => Promise<unknown>)[] = [
        removeOwnerFromPage,
        removeAdminsFromPage,
        removeFollowersFromPage,
        removePagePosts,
        removePageComments,
      ];

      const mediaArr = [
        page.profilePicture?.public_id,
        page.coverPicture?.public_id,
        ...postsMedia
          .map((post) => post.media)
          .flat(Infinity)
          .map((media) => media.public_id),
        ...commentsMedia
          .map((comment) => comment.media)
          .flat(Infinity)
          .map((media) => media.public_id),
      ].filter(Boolean);

      if (mediaArr.length) promisesArr.push(() => deleteMedia(mediaArr));

      await Promise.allSettled(promisesArr.map((promise) => promise()));

      return { message: "page deleted successfully" };
    },
  });
};

export default deletePage;
