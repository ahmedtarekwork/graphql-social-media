// utils
import handleConnectDB from "@/lib/handleConnectDB";

import type {
  APIContextFnType,
  NotFullUserType,
  Pagination,
} from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import User from "../../../../_models/user.model";

const getAllUsers = async (
  _: unknown,
  { wantedUsers: { limit = 0, page = 1 } }: { wantedUsers: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while getting the users",
    async resolveCallback(user) {
      const [users, usersCount] = await Promise.allSettled([
        User.find({ _id: { $nin: [user._id] } })
          .skip(page - 1)
          .limit(limit)
          .select("username profilePicture"),

        User.countDocuments(),
      ]);

      if ([users, usersCount].some((res) => res.status === "rejected")) {
        throw new GraphQLError("something went wrong while getting the users", {
          extensions: {
            code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
          },
        });
      }

      return {
        users: (users as unknown as { value: NotFullUserType[] }).value || [],
        isFinalPage:
          page * limit >= (usersCount as unknown as { value: number })?.value ||
          0,
      };
    },
  });
};

export default getAllUsers;
