// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import { deleteMedia } from "@/lib/utils";
import handleConnectDB from "@/lib/handleConnectDB";
import isUserMemberInGroupFn from "../../utils/isUserMemberInGroup";

// models
import Group from "../../../../_models/group.model";
import User from "../../../../_models/user.model";
import Post from "../../../../_models/post.model";
import Comment from "../../../../_models/comment.model";

// types
import type { APIContextFnType } from "@/lib/types";

const exitGroup = async (
  _: unknown,
  { groupId }: { groupId: string },
  { req }: APIContextFnType
) => {
  if (!groupId) {
    throw new GraphQLError("group id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while try to joining you in the group",
    async resolveCallback(user) {
      const group = (await Group.findById(groupId).select("owner"))?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserMemberInGroup = await isUserMemberInGroupFn(
        user._id,
        groupId
      );

      if (!isUserMemberInGroup) {
        throw new GraphQLError("you aren't member in this group already", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (group.owner.toString() === user._id) {
        throw new GraphQLError(
          "you can't exit from group because you are the owner"
        );
      }

      await User.updateOne(
        { _id: user._id },
        { $pull: { joinedGroups: groupId } }
      ); // exit user from group

      const postsMediaAndIDs = await Post.find({
        owner: user._id,
        communityId: group._id.toString(),
      }).select("media");

      const myPostsCommentsMediaPromise = Comment.find({
        communityId: group._id.toString(),
        post: { $in: postsMediaAndIDs.map((post) => post._id.toString()) },
      }).select("media");

      const myCommentsOnOtherMembersPostsPromise = Comment.find({
        communityId: group._id.toString(),
        owner: user._id,
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
        owner: user._id,
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
            owner: user._id,
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
        message: "you are successfully exit from the group",
      };
    },
  });
};

export default exitGroup;
