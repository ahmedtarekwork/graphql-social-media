// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import { jwtVerify } from "jose";

// models
import User from "../app/api/_models/user.model";

// types
import type { NextRequest } from "next/server";
import type { UserType } from "./types";

export type ValidateTokenUserQuery = (
  userId: string
) => ReturnType<typeof User.findById>;

const validateToken = async (
  req: NextRequest,
  userQuery?: ValidateTokenUserQuery
): Promise<(UserType & { password: string }) | undefined> => {
  const token = req.cookies.get("ahmed-social-media-app-user-token")?.value;

  if (token) {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );

    if (payload.id) {
      try {
        const user = await (userQuery?.(payload.id as string) ||
          User.findById(payload.id, {
            followedPages: { $slice: [0, 10] },
            joinedGroups: { $slice: [0, 10] },
            ownedPages: { $slice: [0, 10] },
            adminPages: { $slice: [0, 10] },
            ownedGroups: { $slice: [0, 10] },
            adminGroups: { $slice: [0, 10] },
          }).select(
            "-__v -allPosts -savedPosts -password -notifications -friendsList -friendsRequests"
          ));

        if (!user) return undefined;

        if (user) {
          return { ...user._doc, _id: user._doc._id.toString() };
        }
      } catch (err) {
        console.log(err);

        throw new GraphQLError("something went wrong", {
          extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
        });
      }
    }
  }
};

export default validateToken;
