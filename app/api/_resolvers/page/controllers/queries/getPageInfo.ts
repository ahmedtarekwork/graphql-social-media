// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Page from "../../../../_models/page.model";

const getPageInfo = async (_: unknown, { pageId }: { pageId: string }) => {
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
};

export default getPageInfo;
