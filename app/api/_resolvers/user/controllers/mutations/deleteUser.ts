// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";
import { Types } from "mongoose";

// models
import User from "../../../../_models/user.model";
import Page from "../../../../_models/page.model";
import Group from "../../../../_models/group.model";
import Post from "../../../../_models/post.model";
import Comment from "../../../../_models/comment.model";
import Story from "../../../../_models/story.model";

import type {
  APIContextFnType,
  GroupType,
  PageType,
  PostType,
  UserType,
} from "@/lib/types";

type ReturnedUserFromDB = Record<
  "followedPages" | "adminPages" | "joinedGroups" | "adminGroups",
  (typeof Types.ObjectId)[]
> &
  Record<
    "ownedPages" | "ownedGroups",
    Pick<
      PageType | GroupType,
      "profilePicture" | "coverPicture" | "_id" | "admins"
    >[]
  > &
  Pick<UserType, "profilePicture" | "coverPicture" | "_id">;

const allMediaIDs = async (authUser: ReturnedUserFromDB) => {
  const allMedia = [
    authUser.profilePicture?.public_id,
    authUser.coverPicture?.public_id,

    ...authUser.ownedGroups
      .map((group) => {
        return [group.profilePicture?.public_id, group.coverPicture?.public_id];
      })
      .flat(Infinity),

    ...authUser.ownedPages
      .map((page: Pick<PageType, "profilePicture" | "coverPicture">) => {
        return [page.profilePicture?.public_id, page.coverPicture?.public_id];
      })
      .flat(Infinity),
  ].filter(Boolean);

  const ownedPostsMediaAndIDsPromise = () =>
    Post.find({
      owner: authUser._id,
    }).select("media");

  const ownedCommentsMedia = () =>
    Comment.find({
      owner: authUser._id,
    }).select("media");
  const otherUsersCommentsMediaOnMyPosts = () =>
    Comment.find({
      community: { $in: ["personal", "group"] },
      owner: authUser._id,
    }).select("media");

  const ownedStoriesMedia = () =>
    Story.find({ owner: authUser._id }).select("media");

  const [storiesMediaRes, commentsMediaRes, postsMediaRes] =
    await Promise.allSettled([
      ownedStoriesMedia(),
      ownedCommentsMedia(),
      otherUsersCommentsMediaOnMyPosts(),
      ownedPostsMediaAndIDsPromise(),
    ]);

  const storiesMedia =
    storiesMediaRes.status === "fulfilled" ? storiesMediaRes.value : [];
  const commentsMedia =
    commentsMediaRes.status === "fulfilled" ? commentsMediaRes.value : [];
  const postsMedia =
    postsMediaRes.status === "fulfilled" ? postsMediaRes.value : [];

  allMedia.push(
    ...[...storiesMedia, ...commentsMedia, ...postsMedia]
      .map((item) => item.media)
      .flat(Infinity)
      .map((media) => media.public_id)
      .filter(Boolean)
  );

  return { allMedia, postsMedia };
};

const pagesQueries = (authUser: ReturnedUserFromDB) => {
  const removeUserFromFollowedPages = () =>
    Page.updateMany(
      {
        _id: {
          $in: authUser.followedPages,
        },
      },
      {
        $inc: { followersCount: -1 },
      }
    );
  const removeUserFromAdminPages = () =>
    Page.updateMany(
      {
        _id: {
          $in: authUser.adminPages,
        },
      },
      {
        $pull: {
          admins: authUser._id,
        },
      }
    );

  const ownedPagesAdminIDs = authUser.ownedPages
    .map((page) => page.admins)
    .flat(Infinity);

  const removeAdminsFromOwnedPages = () =>
    User.updateMany(
      {
        _id: {
          $in: ownedPagesAdminIDs,
        },
      },
      {
        $pull: {
          adminPages: {
            $in: ownedPagesAdminIDs,
          },
        },
      }
    );

  const removeAllFollowersFromOwnedPages = () =>
    User.updateMany(
      {
        followedPages: {
          $in: authUser.ownedPages.map((page) => page._id),
        },
      },
      {
        $pull: {
          followedPages: {
            $in: authUser.ownedPages.map((page) => page._id),
          },
        },
      }
    );

  const removeOwnedPages = () =>
    Page.deleteMany({
      _id: {
        $in: authUser.ownedPages.map((page) => page._id),
      },
    });

  return [
    removeUserFromFollowedPages,
    removeUserFromAdminPages,
    removeAdminsFromOwnedPages,
    removeAllFollowersFromOwnedPages,
    removeOwnedPages,
  ];
};

const groupsQueries = (authUser: ReturnedUserFromDB) => {
  const removeUserFromJoinedGroups = () =>
    Group.updateMany(
      {
        _id: {
          $in: authUser.joinedGroups,
        },
      },
      {
        $inc: { membersCount: -1 },
      }
    );

  const removeUserFromAdminGroups = () =>
    Group.updateMany(
      {
        _id: {
          $in: authUser.adminGroups,
        },
      },
      {
        $pull: {
          admins: authUser._id,
        },
      }
    );

  const ownedGroupsAdminIDs = authUser.ownedGroups
    .map((group) => group.admins)
    .flat(Infinity);

  const removeAdminsFromOwnedGroups = () =>
    User.updateMany(
      {
        _id: {
          $or: ownedGroupsAdminIDs,
        },
      },
      {
        $pull: {
          adminGroups: {
            $or: ownedGroupsAdminIDs,
          },
        },
      }
    );

  const removeAllMembersFromOwnedGroups = () =>
    User.updateMany(
      {
        joinedGroups: {
          $in: authUser.ownedGroups.map((group) => group._id),
        },
      },
      {
        $pull: {
          joinedGroups: {
            $in: authUser.ownedGroups.map((group) => group._id),
          },
        },
      }
    );

  const removeOwnedGroups = () => Group.deleteMany({ owner: authUser._id });

  return [
    removeUserFromJoinedGroups,
    removeUserFromAdminGroups,
    removeAdminsFromOwnedGroups,
    removeAllMembersFromOwnedGroups,
    removeOwnedGroups,
  ];
};

const friendsQueries = (authUser: ReturnedUserFromDB) => {
  const removeUserFromFriends = () =>
    User.updateMany(
      { friendsList: authUser._id },
      { $pull: { friendsList: authUser._id } }
    );

  const removeUserFriendshipRequestsToOtherUsers = () =>
    User.updateMany(
      { friendsRequests: authUser._id },
      { $pull: { friendsRequests: authUser._id } }
    );

  return [removeUserFromFriends, removeUserFriendshipRequestsToOtherUsers];
};

const postsQueries = (authUser: ReturnedUserFromDB, postsMedia: PostType[]) => {
  const removePostsFromUsersSavedPosts = () =>
    User.updateMany(
      {
        savedPosts: {
          $in: postsMedia.map((post) => post._id),
        },
      },
      {
        $pull: {
          savedPosts: {
            $in: postsMedia.map((post) => post._id),
          },
        },
      }
    );

  const removeUserPosts = () => Post.deleteMany({ owner: authUser._id });

  return [removePostsFromUsersSavedPosts, removeUserPosts];
};

const commentsQueries = (authUser: ReturnedUserFromDB) => {
  const removeUserComments = () =>
    Comment.deleteMany({
      owner: authUser._id,
    });
  const removeOtherUserCommentsOnMyPosts = () =>
    Comment.deleteMany({
      community: { $in: ["personal", "group"] },
      owner: authUser._id,
    });

  return [removeUserComments, removeOtherUserCommentsOnMyPosts];
};

const deleteUser = async (
  _: unknown,
  __: unknown,
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while deleting your account",

    userQuery: (userId: string) => {
      return User.findByIdAndDelete(userId)
        .select(
          "followedPages adminPages ownedPages joinedGroups adminGroups ownedGroups profilePicture coverPicture"
        )
        .populate([
          {
            path: "ownedPages ownedGroups",
            select: "profilePicture coverPicture admins",
          },
        ]);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async resolveCallback(user: any) {
      const authUser = user as ReturnedUserFromDB;

      const MediaIDs = await allMediaIDs(authUser);

      const removeUserStories = () =>
        Story.deleteMany({
          owner: authUser._id,
        });

      // sending the promises
      await Promise.allSettled([
        deleteMedia(MediaIDs.allMedia as string[]),
        ...friendsQueries(authUser).map((promise) => promise()),
        ...pagesQueries(authUser).map((promise) => promise()),
        ...groupsQueries(authUser).map((promise) => promise()),
        ...postsQueries(authUser, MediaIDs.postsMedia).map((promise) =>
          promise()
        ),
        commentsQueries(authUser).map((promise) => promise()),
        removeUserStories(),
      ]);

      return { message: "your account deleted successfully" };
    },
  });
};

export default deleteUser;
