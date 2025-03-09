// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Group from "../../../../_models/group.model";
import User from "../../../../_models/user.model";
import Post from "../../../../_models/post.model";
import Comment from "../../../../_models/comment.model";

// types
import { APIContextFnType } from "@/lib/types";

const deleteGroup = async (
  _: unknown,
  { groupId }: { groupId: string },
  { req }: APIContextFnType
) => {
  if (!groupId) {
    throw new GraphQLError("group id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while deleting the group",
    async resolveCallback(user) {
      const group = (
        await Group.findById(groupId).select(
          "owner profilePicture coverPicture"
        )
      )?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (group.owner.toString() !== user._id) {
        throw new GraphQLError("group owner can only delete the group", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      await Group.deleteOne({ _id: groupId });

      const [postsMediaRes, commentsMediaRes] = await Promise.allSettled([
        Post.find({ communityId: groupId }).select("media"),
        Comment.find({ communityId: groupId }).select("media"),
      ]);

      const postsMedia =
        postsMediaRes.status === "fulfilled" ? postsMediaRes.value : [];
      const commentsMedia =
        commentsMediaRes.status === "fulfilled" ? commentsMediaRes.value : [];

      const removeOwnerFromGroup = () =>
        User.updateOne(
          { _id: user._id },
          {
            $pull: { ownedGroups: groupId },
          }
        );

      const removeAdminsFromGroup = () =>
        User.updateMany(
          { adminGroups: groupId },
          {
            $pull: {
              adminGroups: groupId,
            },
          }
        );

      const removeMembersFromGroup = () =>
        User.updateMany(
          { joinedGroups: groupId },
          {
            $pull: { joinedGroups: groupId },
          }
        );

      const removeGroupPosts = () => Post.deleteMany({ communityId: groupId });
      const removeGroupComments = () =>
        Comment.deleteMany({
          communityId: groupId,
        });

      const promisesArr: (() => Promise<unknown>)[] = [
        removeOwnerFromGroup,
        removeAdminsFromGroup,
        removeMembersFromGroup,
        removeGroupPosts,
        removeGroupComments,
      ];

      const mediaArr = [
        group.profilePicture?.public_id,
        group.coverPicture?.public_id,
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

      return { message: "group deleted successfully" };
    },
  });
};

export default deleteGroup;
