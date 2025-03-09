// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Group from "../../../../_models/group.model";

const getSingleGroup = async (
  _: undefined,
  { groupId }: { groupId: string }
) => {
  if (!groupId) {
    throw new GraphQLError("group id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting group info",
    async resolveCallback() {
      const group = (await Group.findById(groupId).select("-joinRequests"))
        ?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return { ...group, owner: { _id: group.owner } };
    },
  });
};

export default getSingleGroup;
