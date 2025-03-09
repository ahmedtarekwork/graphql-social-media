// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserFollowingthePageFn from "../../utils/isUserFollowingPage";

// models
import Page from "../../../../_models/page.model";

// types
import type { APIContextFnType } from "@/lib/types";

const isUserFollowingPage = async (
  _: unknown,
  { pageId }: { pageId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
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

      const isUserFollowingPage = await isUserFollowingthePageFn(
        user._id,
        pageId
      );

      return { isUserFollowingPage };
    },
  });
};

export default isUserFollowingPage;
