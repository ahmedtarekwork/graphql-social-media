// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import { deleteMedia } from "@/lib/utils";
import handleConnectDB from "@/lib/handleConnectDB";
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";
import isUserMemberInGroupFn from "../../utils/isUserMemberInGroup";

// models
import Group from "../../../../_models/group.model";
import User from "../../../../_models/user.model";
import Post from "../../../../_models/post.model";
import Comment from "../../../../_models/comment.model";

// types
import type { APIContextFnType } from "@/lib/types";

const expulsingFromTheGroup = async (
  _: unknown,
  {
    expulsingFromGroupData: { groupId, memberId },
  }: { expulsingFromGroupData: Record<"memberId" | "groupId", string> },
  { req }: APIContextFnType
) => {
  if (!groupId || !memberId) {
    throw new GraphQLError(`${!memberId ? "member" : "group"} id is required`, {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while try to expulsing member from group",
    async resolveCallback(user) {
      const group = (await Group.findById(groupId).select("name owner"))?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isAuthUserAdminInGroup = await isUserAdminInGroupFn(
        user._id,
        groupId
      );

      if (
        !isAuthUserAdminInGroup &&
        group.owner.toString() !== user._id.toString()
      ) {
        throw new GraphQLError(
          "you don't have ability to expulsing members from this group",
          { extensions: { code: "FORBIDDEN" } }
        );
      }

      const isMemberIsActuallyMemberInGroup = await isUserMemberInGroupFn(
        memberId,
        groupId
      );

      if (!isMemberIsActuallyMemberInGroup) {
        throw new GraphQLError("user isn't a member in the group", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      const isMemberAdminInGroup = await isUserAdminInGroupFn(
        memberId,
        groupId
      );

      if (isMemberAdminInGroup && group.owner.toString() !== user._id) {
        throw new GraphQLError(
          "group owner only can expulsing admins from the group",
          {
            extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
          }
        );
      }

      if (group.owner.toString() === user._id && user._id === memberId) {
        throw new GraphQLError(
          "you can't expulsing your self from the group because you are the owner"
        );
      }

      const updatedUserData = {
        $pull: { joinedGroups: groupId },
        $push: {
          notifications: {
            icon: "group",
            caption: `you have been expulsing from ${group.name} Group by one of the group admins`,
          },
        },
      } as Record<string, unknown>;

      if (isMemberAdminInGroup) {
        updatedUserData.$pull = {
          ...(updatedUserData.$pull as Record<string, unknown>),
          adminGroups: groupId,
        };
      }

      await User.updateOne({ _id: memberId }, updatedUserData); // expulsing member from group

      const postsMediaAndIDs = await Post.find({
        owner: memberId,
        communityId: group._id.toString(),
      }).select("media");

      const myPostsCommentsMediaPromise = Comment.find({
        communityId: group._id.toString(),
        post: { $in: postsMediaAndIDs.map((post) => post._id.toString()) },
      }).select("media");

      const myCommentsOnOtherMembersPostsPromise = Comment.find({
        communityId: group._id.toString(),
        owner: memberId,
        post: {
          $not: {
            $in: postsMediaAndIDs.map((post) => post._id.toString()),
          },
        },
      }).select("media post");

      const [myPostsCommentsMediaRes, myCommentsOnOtherMembersPostsRes] =
        await Promise.allSettled([
          myPostsCommentsMediaPromise,
          myCommentsOnOtherMembersPostsPromise,
        ]);
      const myPostsCommentsMedia =
        myPostsCommentsMediaRes.status === "fulfilled"
          ? myPostsCommentsMediaRes.value
          : [];
      const myCommentsOnOtherMembersPosts =
        myCommentsOnOtherMembersPostsRes.status === "fulfilled"
          ? myCommentsOnOtherMembersPostsRes.value
          : [];

      const deleteAllMedia = deleteMedia([
        ...postsMediaAndIDs
          .map((post) => post.media)
          .flat(Infinity)
          .map((media) => media.public_id),
        ...[...myPostsCommentsMedia, ...myCommentsOnOtherMembersPosts]
          .map((comment) => comment.media)
          .flat(Infinity)
          .map((media) => media.public_id),
      ]);

      const updateGroupMembersCount = Group.updateOne(
        { _id: groupId },
        {
          $inc: {
            membersCount: -1,
          },
        }
      );

      const removeUserProstsFromGroup = Post.deleteMany({
        owner: memberId,
        communityId: group._id.toString(),
      });

      const removeComments = Comment.deleteMany({
        $or: [
          {
            communityId: group._id.toString(),
            post: {
              $in: postsMediaAndIDs.map((post) => post._id.toString()),
            },
          },
          {
            communityId: group._id.toString(),
            owner: memberId,
          },
        ],
      });

      await Promise.allSettled([
        removeComments,
        updateGroupMembersCount,
        removeUserProstsFromGroup,
        deleteAllMedia,
      ]);

      const commentsCount = await Comment.aggregate([
        {
          $match: {
            post: {
              $in: myCommentsOnOtherMembersPosts.map(
                (comment) => new Types.ObjectId(comment.post)
              ),
            },
          },
        },
        {
          $group: {
            _id: "$post",
            count: { $sum: 1 },
          },
        },
      ]);

      const bulkOps = commentsCount.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { commentsCount: item.count } },
        },
      }));

      await Post.bulkWrite(bulkOps);

      return {
        message: "you are successfully expulsed this member from the group",
      };
    },
  });
};

export default expulsingFromTheGroup;
