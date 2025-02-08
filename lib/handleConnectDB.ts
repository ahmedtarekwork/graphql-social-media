// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import connectDB from "./connectDB";
import validateReqToken, { type ValidateTokenUserQuery } from "./validateToken";

// types
import type { NextRequest } from "next/server";

type ValidateTokenOption =
  | {
      userQuery?: ValidateTokenUserQuery;
      req: NextRequest;
      validateToken: true;
      resolveCallback: (
        user: NonNullable<Awaited<ReturnType<typeof validateReqToken>>>
      ) => unknown | Promise<unknown>;
    }
  | {
      userQuery?: never;
      getUserFriends?: never;
      validateToken?: false | never;
      req?: never | NextRequest;
      resolveCallback: (
        user: Awaited<ReturnType<typeof validateReqToken>> | undefined
      ) => unknown | Promise<unknown>;
    };

type handleConnectDBFuncParams = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorCallback?: (error: any) => Error | void;
  publicErrorMsg?: string;
  showDatabaseErr?: boolean;
} & ValidateTokenOption;

const handleConnectDB = async ({
  userQuery,
  validateToken,
  req,
  resolveCallback,
  errorCallback,
  publicErrorMsg,
  showDatabaseErr,
}: handleConnectDBFuncParams) => {
  try {
    const connection = await connectDB();
    if (connection instanceof GraphQLError) throw connection;

    const authenticatedUser = req && (await validateReqToken(req, userQuery));

    if (!authenticatedUser && req && validateToken) {
      throw new GraphQLError("you need to login first", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await resolveCallback(authenticatedUser as any);
    if (result instanceof GraphQLError) throw result;

    return result;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error);

    if (error instanceof GraphQLError) {
      throw error;
    }

    if (error.code === 11000) {
      throw new GraphQLError(
        "other users took this info, please try other username or email",
        {
          extensions: {
            code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
          },
        }
      );
    }

    if (showDatabaseErr) {
      const errorMsg = (Object.values(error.errors)[0] as { message: string })
        ?.message;

      if (errorMsg) {
        throw new GraphQLError(errorMsg, {
          extensions: {
            code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
          },
        });
      }
    }

    const errorResult = errorCallback?.(error);

    if (errorResult instanceof GraphQLError) throw errorResult;

    throw new GraphQLError(
      publicErrorMsg || "something went wrong, please try again later",
      {
        extensions: {
          code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
        },
      }
    );
  }
};

export default handleConnectDB;
