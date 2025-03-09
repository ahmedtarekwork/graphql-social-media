// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserFollowingPageFn from "../../utils/isUserFollowingPage";

// models
import Page from "../../../../_models/page.model";
import User from "../../../../_models/page.model";

// types
import type { APIContextFnType } from "@/lib/types";

const togglePageFollow = async (
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

      const isUserFollowingPage = await isUserFollowingPageFn(user._id, pageId);

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
};

export default togglePageFollow;
