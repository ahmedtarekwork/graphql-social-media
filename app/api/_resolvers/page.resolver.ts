// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";
import { Types } from "mongoose";

// models
import User from "../_models/user.model";
import Page from "../_models/page.model";
import Post from "../_models/post.model";
import Comment from "../_models/comment.model";

// types
import type {
  APIContextFnType,
  ImageType,
  PageType,
  Pagination,
  PostType,
} from "@/lib/types";

const pageResolvers = {
  Query: {
    getPageInfo: async (_: unknown, { pageId }: { pageId: string }) => {
      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        publicErrorMsg: "can't get page info at the momment",
        async resolveCallback() {
          const page = (await Page.findById(pageId))?._doc;

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          return { ...page, owner: { _id: page.owner } };
        },
      });
    },
    getExplorePages: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) => {
      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "can't get available pages at the momment",
        async resolveCallback(user) {
          const pagesResult = await Page.aggregate([
            {
              $lookup: {
                from: "users",
                let: {
                  authenticatedUserId: new Types.ObjectId(user._id),
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$authenticatedUserId"],
                      },
                    },
                  },
                  {
                    $project: {
                      followedPages: { $ifNull: ["$followedPages", []] },
                      adminPages: { $ifNull: ["$adminPages", []] },
                      ownedPages: { $ifNull: ["$ownedPages", []] },
                    },
                  },
                ],
                as: "authUserDetails",
              },
            },
            { $unwind: "$authUserDetails" },

            {
              $match: {
                $expr: {
                  $not: {
                    $or: [
                      { $in: ["$_id", "$authUserDetails.followedPages"] },
                      { $in: ["$_id", "$authUserDetails.adminPages"] },
                      { $in: ["$_id", "$authUserDetails.ownedPages"] },
                    ],
                  },
                },
              },
            },

            {
              $facet: {
                metadata: [{ $count: "total" }],

                pages: [
                  { $limit: limit },
                  { $skip: (page - 1) * limit },

                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      profilePicture: 1,
                      followersCount: 1,
                    },
                  },
                ],
              },
            },
          ]);

          const pages = pagesResult?.[0]?.pages || [];
          const count = pagesResult?.[0]?.metadata?.[0]?.total || 0;

          return { pages, isFinalPage: page * limit >= count };
        },
      });
    },

    getFollowedPages: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg:
          "something went wrong while getting your followed pages",
        req,
        validateToken: true,

        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                pagesCount: [
                  {
                    $project: {
                      pagesCount: {
                        $size: { $ifNull: ["$followedPages", []] },
                      },
                    },
                  },
                ],

                pages: [
                  { $unwind: "$followedPages" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "pages",
                      localField: "followedPages",
                      foreignField: "_id",
                      as: "pageInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      pageInfo: {
                        _id: 1,
                        name: 1,
                        profilePicture: 1,
                        followersCount: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      pages: {
                        $push: "$pageInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          return {
            pages: result?.[0]?.pages?.[0]?.pages?.[0] || [],
            isFinalPage:
              page * limit >= result?.[0]?.pagesCount?.[0]?.pagesCount || 0,
          };
        },
      }),
    getAdminPages: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting your admin pages",
        req,
        validateToken: true,

        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                pagesCount: [
                  {
                    $project: {
                      pagesCount: {
                        $size: { $ifNull: ["$adminPages", []] },
                      },
                    },
                  },
                ],

                pages: [
                  { $unwind: "$adminPages" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "pages",
                      localField: "adminPages",
                      foreignField: "_id",
                      as: "pageInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      pageInfo: {
                        _id: 1,
                        name: 1,
                        profilePicture: 1,
                        followersCount: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      pages: {
                        $push: "$pageInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          return {
            pages: result?.[0]?.pages?.[0]?.pages?.[0] || [],
            isFinalPage:
              page * limit >= result?.[0]?.pagesCount?.[0]?.pagesCount || 0,
          };
        },
      }),
    getOwnedPages: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting your owned pages",
        req,
        validateToken: true,

        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                pagesCount: [
                  {
                    $project: {
                      pagesCount: {
                        $size: { $ifNull: ["$ownedPages", []] },
                      },
                    },
                  },
                ],

                pages: [
                  { $unwind: "$ownedPages" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "pages",
                      localField: "ownedPages",
                      foreignField: "_id",
                      as: "pageInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      pageInfo: {
                        _id: 1,
                        name: 1,
                        profilePicture: 1,
                        followersCount: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      pages: {
                        $push: "$pageInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          return {
            pages: result?.[0]?.pages?.[0]?.pages?.[0] || [],
            isFinalPage:
              page * limit >= result?.[0]?.pagesCount?.[0]?.pagesCount || 0,
          };
        },
      }),

    getPagePosts: async (
      _: unknown,
      {
        paginatedPosts: { pageId, limit = 0, page = 1, skip = 0 },
      }: { paginatedPosts: Pagination<{ pageId: string; skip: number }> },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        publicErrorMsg: "something went wrong while getting page posts",
        async resolveCallback(user) {
          const mainSkip = (page - 1) * limit;

          if (!pageId) {
            throw new GraphQLError("page id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const pageDoc = (
            await Page.findById(pageId).select("name profilePicture")
          )._doc;

          if (!pageDoc) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          const posts = await Post.aggregate([
            {
              $match: {
                communityId: new Types.ObjectId(pageId),
              },
            },
            {
              $facet: {
                metadata: [{ $count: "total" }],

                posts: [
                  { $sort: { createdAt: -1 } },
                  { $skip: mainSkip - skip < 0 ? 0 : mainSkip - skip },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "users",
                      localField: "owner",
                      foreignField: "_id",
                      as: "postOwner",
                    },
                  },
                  { $unwind: "$postOwner" },

                  ...(user?._id
                    ? [
                        {
                          $lookup: {
                            from: "users",
                            let: {
                              authenticatedUserId: new Types.ObjectId(user._id),
                            },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ["$_id", "$$authenticatedUserId"],
                                  },
                                },
                              },
                              { $project: { sharedPosts: 1, savedPosts: 1 } },
                            ],
                            as: "authUserDetails",
                          },
                        },
                        { $unwind: "$authUserDetails" },

                        {
                          $addFields: {
                            isShared: {
                              $cond: {
                                if: {
                                  $in: ["$_id", "$authUserDetails.sharedPosts"],
                                },
                                then: true,
                                else: false,
                              },
                            },
                            isInBookMark: {
                              $cond: {
                                if: {
                                  $in: ["$_id", "$authUserDetails.savedPosts"],
                                },
                                then: true,
                                else: false,
                              },
                            },
                          },
                        },
                      ]
                    : []),

                  {
                    $project: {
                      _id: 1,
                      caption: 1,
                      reactions: {
                        like: { count: 1 },
                        love: { count: 1 },
                        sad: { count: 1 },
                        angry: { count: 1 },
                      },
                      owner: {
                        _id: "$postOwner._id",
                        username: "$postOwner.username",
                        profilePicture: "$postOwner.profilePicture",
                      },
                      media: 1,
                      commentsCount: 1,
                      blockComments: 1,
                      privacy: 1,
                      community: 1,
                      communityId: 1,
                      shareData: { count: 1 },
                      shareDate: "$createdAt",
                      isInBookMark: user?._id ? 1 : false,
                      isShared: user?._id ? 1 : false,
                    },
                  },
                ],
              },
            },
          ]);

          const count = posts?.[0]?.metadata?.[0]?.total;

          return {
            posts: (posts?.[0]?.posts || []).map((post: PostType) => ({
              ...post,
              communityInfo: {
                _id: pageDoc._id,
                name: pageDoc.name,
                profilePicture: pageDoc.profilePicture,
              },
            })),
            isFinalPage: page * limit >= count,
          };
        },
      }),

    getPageAdminsList: async (
      _: unknown,
      {
        paginationData: { pageId, limit = 0, page = 1, skip = 0 },
      }: { paginationData: Pagination<{ pageId: string; skip: number }> },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        validateToken: true,
        req,
        publicErrorMsg: "something went wrong while getting page admins list",
        async resolveCallback(user) {
          const mainSkipCount = (page - 1) * limit;

          if (!pageId) {
            throw new GraphQLError("page id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const pageDoc = await Page.findById(pageId).select("owner");

          if (!pageDoc) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInPage = (
            await Page.aggregate([
              { $match: { _id: new Types.ObjectId(pageId) } },
              {
                $project: {
                  isUserAdminInPage: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInPage: true } },
            ])
          )?.[0]?.isUserAdminInPage;

          if (
            pageDoc.owner.toString() !== user._id.toString() &&
            !isUserAdminInPage
          ) {
            throw new GraphQLError(
              "page owner or admins can only the admins list of page",
              { extensions: { code: "FORBIDDEN" } }
            );
          }

          const adminsList = await Page.aggregate([
            { $match: { _id: new Types.ObjectId(pageId) } },
            {
              $facet: {
                adminsCount: [
                  {
                    $project: {
                      adminsCount: {
                        $size: "$admins",
                      },
                    },
                  },
                ],

                admins: [
                  { $unwind: "$admins" },
                  {
                    $skip: mainSkipCount + skip < 0 ? 0 : mainSkipCount + skip,
                  },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "users",
                      localField: "admins",
                      foreignField: "_id",
                      as: "adminInfo",
                    },
                  },

                  {
                    $unwind: "$adminInfo",
                  },

                  {
                    $project: {
                      _id: 0,
                      adminInfo: {
                        _id: 1,
                        username: 1,
                        profilePicture: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      admins: {
                        $push: "$adminInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          const adminsCount =
            adminsList?.[0]?.adminsCount?.[0]?.adminsCount || 0;
          const admins = adminsList?.[0]?.admins?.[0]?.admins || [];

          return {
            admins,
            isFinalPage: page * limit >= adminsCount,
          };
        },
      }),

    isUserFollowingPage: async (
      _: unknown,
      { pageId }: { pageId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        validateToken: true,
        req,
        publicErrorMsg:
          "something went wrong while asking if you follow this page or not",
        async resolveCallback(user) {
          if (!pageId) {
            throw new GraphQLError("page id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          if (!(await Page.exists({ _id: pageId }))) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserFollowingPage = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $project: {
                isUserFollowingPage: {
                  $in: [new Types.ObjectId(pageId), "$followedPages"],
                },
              },
            },
            { $match: { isUserFollowingPage: true } },
          ]);

          return {
            isUserFollowingPage:
              !!isUserFollowingPage?.[0]?.isUserFollowingPage,
          };
        },
      }),

    isUserAdminInPage: async (
      _: unknown,
      { pageId }: { pageId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        validateToken: true,
        req,
        publicErrorMsg:
          "something went wrong while asking if you are admin in this page or not",
        async resolveCallback(user) {
          if (!pageId) {
            throw new GraphQLError("page id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          if (!(await Page.exists({ _id: pageId }))) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInPage = await Page.aggregate([
            { $match: { _id: new Types.ObjectId(pageId) } },
            {
              $project: {
                isUserAdminInPage: {
                  $in: [new Types.ObjectId(user._id), "$admins"],
                },
              },
            },
            { $match: { isUserAdminInPage: true } },
          ]);

          return {
            isUserAdminInPage: !!isUserAdminInPage?.[0]?.isUserAdminInPage,
          };
        },
      }),
  },

  Mutation: {
    togglePageFollow: async (
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
        publicErrorMsg: "something went wrong while do this operation",
        async resolveCallback(user) {
          const page = await Page.findById(pageId).select("owner");

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserFollowingPage = (
            await User.aggregate([
              { $match: { _id: new Types.ObjectId(user._id) } },
              {
                $project: {
                  isUserFollowingPage: {
                    $in: [new Types.ObjectId(pageId), "$followedPages"],
                  },
                },
              },
              { $match: { isUserFollowingPage: true } },
            ])
          )?.[0]?.isUserFollowingPage;

          await User.updateOne(
            { _id: user._id },
            {
              [`$${isUserFollowingPage ? "pull" : "push"}`]: {
                followedPages: pageId,
              },
            }
          );

          await Page.updateOne(
            { _id: pageId },
            {
              $inc: {
                followersCount: isUserFollowingPage ? -1 : 1,
              },
            }
          );

          return {
            message: `you are${
              isUserFollowingPage ? "n't" : ""
            } following this page ${isUserFollowingPage ? "after" : ""} now`,
          };
        },
      });
    },

    togglePageAdmin: async (
      _: unknown,
      {
        toggleAdminData: { pageId, newAdminId, toggle },
      }: {
        toggleAdminData: Record<"pageId" | "newAdminId", string> & {
          toggle: "add" | "remove";
        };
      },
      { req }: APIContextFnType
    ) => {
      if (!pageId || !newAdminId) {
        throw new GraphQLError(
          `${!newAdminId ? "admin id" : "page id"} is required`,
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: `something went wrong while ${toggle} admin ${
          toggle === "add" ? "to" : "from"
        } page`,

        async resolveCallback(user) {
          const page = (await Page.findById(pageId).select("owner admins"))
            ?._doc;

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isAdmin = (
            await Page.aggregate([
              { $match: { _id: new Types.ObjectId(pageId) } },
              {
                $project: {
                  isUserAdminInPage: {
                    $in: [new Types.ObjectId(newAdminId), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInPage: true } },
            ])
          )?.[0]?.isUserAdminInPage;

          if (isAdmin && toggle === "add") {
            throw new GraphQLError(
              "user with given id is already an admin in page",
              { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
            );
          }
          if (!isAdmin && toggle === "remove") {
            throw new GraphQLError(
              "user with given id isn't an admin in the page",
              { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
            );
          }

          if (newAdminId === user._id && page.owner.toString() === user._id) {
            throw new GraphQLError(
              "you can't remove your self from group admins because you are the owner"
            );
          }

          if (
            user._id !== page.owner.toString() &&
            // each admin can remove him self from admins list
            user._id !== newAdminId &&
            !isAdmin
          ) {
            throw new GraphQLError("page owner only can add or remove admins", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          await Page.updateOne(
            { _id: pageId },
            {
              [`$${isAdmin ? "pull" : "push"}`]: {
                admins: newAdminId,
              },
            }
          );

          await User.updateOne(
            { _id: newAdminId },
            {
              [`$${isAdmin ? "pull" : "push"}`]: {
                adminPages: newAdminId,
              },
            }
          );

          return {
            message:
              newAdminId === user._id && isAdmin
                ? "you are successfully removed your self from page admins list"
                : `admin ${isAdmin ? "removed" : "added"} successfully`,
          };
        },
      });
    },

    addPage: async (
      _: unknown,
      {
        pageData,
      }: {
        pageData: Pick<PageType, "name" | "coverPicture" | "profilePicture">;
      },
      { req }: APIContextFnType
    ) => {
      if (!pageData.name) {
        throw new GraphQLError("page name is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while create the page",
        async resolveCallback(user) {
          const page = (
            await Page.create({
              ...pageData,
              owner: user._id,
            })
          )?._id;

          await User.updateOne(
            { _id: user._id },
            { $push: { ownedPages: page._id } }
          );

          return page;
        },
      });
    },

    editPage: async (
      _: unknown,
      {
        editPageData: { pageId, ...editPageData },
      }: {
        editPageData: { pageId: string } & Pick<
          PageType,
          "name" | "coverPicture" | "profilePicture"
        >;
      },
      { req }: APIContextFnType
    ) => {
      const keysArr = ["name", "coverPicture", "profilePicture"];
      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!editPageData || keysArr.every((key) => !(key in editPageData))) {
        throw new GraphQLError("you must provide some data to update page", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while update page info",
        async resolveCallback(user) {
          const page = (await Page.findById(pageId).select("owner"))?._doc;

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          const isUserAdminInPage = (
            await Page.aggregate([
              { $match: { _id: new Types.ObjectId(pageId) } },
              {
                $project: {
                  isUserAdminInPage: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInPage: true } },
            ])
          )?.[0]?.isUserAdminInPage;

          if (user._id !== page.owner.toString() && !isUserAdminInPage) {
            throw new GraphQLError(
              "page owner or admins can only update page info",
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
          }

          await Page.updateOne({ _id: pageId }, { $set: editPageData });

          return { message: "page updated successfully" };
        },
      });
    },

    deletePage: async (
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
            await Page.findById(pageId).select(
              "profilePicture coverPicture owner"
            )
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
            commentsMediaRes.status === "fulfilled"
              ? commentsMediaRes.value
              : [];

          const removeOwnerFromPage = User.updateOne(
            { _id: user._id },
            { $pull: { ownedPages: pageId } }
          );
          const removeAdminsFromPage = User.updateMany(
            {
              adminPages: pageId,
            },
            {
              $pull: {
                adminPages: pageId,
              },
            }
          );
          const removeFollowersFromPage = User.updateMany(
            {
              followedPages: pageId,
            },
            {
              $pull: {
                followedPages: pageId,
              },
            }
          );

          const removePagePosts = Post.deleteMany({ communityId: pageId });
          const removePageComments = Comment.deleteMany({
            communityId: pageId,
          });

          const promisesArr: Promise<unknown>[] = [
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

          if (mediaArr.length) promisesArr.push(deleteMedia(mediaArr));

          await Promise.allSettled(promisesArr);

          return { message: "page deleted successfully" };
        },
      });
    },

    removePageProfileOrCoverPicture: async (
      _: unknown,
      {
        removePictureInfo: { pictureType, pageId },
      }: {
        removePictureInfo: { pictureType: "profile" | "cover"; pageId: string };
      },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        validateToken: true,
        req,
        publicErrorMsg: `something went wrong while remove page ${pictureType} picture`,
        async resolveCallback(user) {
          const pictureName = `${pictureType}Picture`;

          if (!pageId) {
            throw new GraphQLError("page id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          if (!pictureType) {
            throw new GraphQLError(
              "you must select one of cover or profile pictures to delete one of them",
              {
                extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
              }
            );
          }

          const page = await Page.findById(pageId).select(
            `owner ${pictureName}`
          );

          if (!page) {
            throw new GraphQLError("page with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInPage = (
            await Page.aggregate([
              { $match: { _id: new Types.ObjectId(pageId) } },
              {
                $project: {
                  isUserAdminInPage: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInPage: true } },
            ])
          )?.[0]?.isUserAdminInPage;

          if (
            page.owner.toString() !== user._id.toString() &&
            !isUserAdminInPage
          ) {
            throw new GraphQLError(
              `page owner or admins can only remove page ${pictureType} picture`,
              { extensions: { code: "FORBIDDEN" } }
            );
          }

          const pictureId = (
            page[
              `${pictureType}Picture` as keyof typeof user
            ] as ImageType | null
          )?.public_id;

          if (!pictureId) {
            throw new GraphQLError(
              `this page dosen't have ${pictureType} picture to remove it`,
              {
                extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
              }
            );
          }

          try {
            await deleteMedia([pictureId]);

            await Page.updateOne(
              { _id: pageId },
              { $set: { [pictureName]: null } }
            );

            return {
              message: `page ${pictureType} picture removed successfully`,
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            throw new GraphQLError(
              `something went wrong while removing page ${pictureType} picture`,
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }
        },
      }),
  },
};

export default pageResolvers;
