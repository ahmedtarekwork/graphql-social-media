// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserMemberInGroupFn from "../../../group/utils/isUserMemberInGroup";
import isUserAdminInGroupFn from "../../../group/utils/isUserAdminInGroup";
import isUserAdminInPageFn from "../../../page/utils/isUserAdminInPage";

// models
import Post from "../../../../_models/post.model";
import Page from "../../../../_models/post.model";
import Group from "../../../../_models/post.model";
import User from "../../../../_models/post.model";

// types
import { APIContextFnType, PostType } from "@/lib/types";

const addPost = async (
  _: unknown,
  {
    postData,
  }: {
    postData: Pick<
      PostType,
      "caption" | "media" | "privacy" | "blockComments" | "community"
    > & { communityId: string };
  },
  { req }: APIContextFnType
) => {
  if (!postData.caption && !postData.media?.length) {
    throw new GraphQLError("post must have caption or media", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if ("community" in postData) {
    if (!["page", "group", "personal"].includes(postData.community)) {
      throw new GraphQLError(
        "community must be one of this values only [page, group, personal]",
        { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
      );
    }

    if (postData.community !== "personal" && !("communityId" in postData)) {
      throw new GraphQLError(
        `${(postData as { community: string }).community} id is required`,
        { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
      );
    }
  }

  if (
    "privacy" in postData &&
    !["friends_only", "public", "only_me"].includes(postData.privacy)
  ) {
    throw new GraphQLError(
      "privacy must be one of this values only [public, only_me, friends_only]",
      { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
    );
  }

  if (
    "privacy" in postData &&
    postData.privacy !== "public" &&
    "community" in postData &&
    postData.community !== "personal"
  ) {
    throw new GraphQLError("privacy must be public when posting in community", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while add the post",
    async resolveCallback(user) {
      switch (postData.community) {
        case "group": {
          const group = (
            await Group.findOne({ _id: postData.communityId }).select("owner")
          )?._doc;
          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserMemberInGroupPromise = () =>
            isUserMemberInGroupFn(user._id, group._id);
          const isUserAdminInGroupPromise = () =>
            isUserAdminInGroupFn(user._id, group._id);

          const [isUserAdminInGroupRes, isUserMemberInGroupRes] =
            await Promise.allSettled([
              isUserMemberInGroupPromise(),
              isUserAdminInGroupPromise(),
            ]);

          const isUserAdminInGroup =
            isUserAdminInGroupRes.status === "fulfilled"
              ? isUserAdminInGroupRes.value
              : [];
          const isUserMemberInGroup =
            isUserMemberInGroupRes.status === "fulfilled"
              ? isUserMemberInGroupRes.value
              : [];

          if (
            !isUserAdminInGroup &&
            !isUserMemberInGroup &&
            user._id.toString() !== group.owner.toString()
          ) {
            throw new GraphQLError(
              "you must be a member in the group to post in it",
              { extensions: { code: "FORBIDDEN" } }
            );
          }
        }

        case "page": {
          const page = (
            await Page.findById(postData.communityId).select("owner")
          )?._doc;

          if (!page) {
            throw new GraphQLError("page not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInPage = await isUserAdminInPageFn(
            user._id,
            postData.communityId
          );

          if (
            !isUserAdminInPage &&
            page.owner.toString() !== user._id.toString()
          ) {
            throw new GraphQLError(
              "page owner or admins can only post on this page",
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
          }
        }
      }

      const post = await Post.create({
        ...postData,
        privacy:
          postData.community !== "personal" // post in group or page
            ? "public"
            : postData.privacy || "public",
        owner: user._id,
      });

      if (!post) {
        throw new GraphQLError(
          "something went wrong while createing the post",
          {
            extensions: {
              code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
            },
          }
        );
      }

      const shareDate = Date.now();

      await User.updateOne(
        { _id: user._id },
        {
          $push: {
            allPosts: {
              post: post._doc._id,
              shareDate,
              privacy: post._doc.privacy,
              community: post._doc.community,
            },
          },
        }
      );

      return {
        ...post._doc,
        owner: JSON.parse(
          JSON.stringify(user, ["_id", "username", "profilePicture"])
        ),
        isShared: false,
        isInBookMark: false,
        shareDate,
      };
    },
  });
};

export default addPost;
