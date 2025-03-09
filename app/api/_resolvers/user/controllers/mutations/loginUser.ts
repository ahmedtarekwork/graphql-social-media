// types
import type { APIContextFnType, ReqUserType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { compare } from "bcrypt";
import { GraphQLError } from "graphql";
import { SignJWT } from "jose";

// models
import User from "../../../../_models/user.model";

const loginUser = async (
  _: unknown,
  {
    loginCredintials: { username, password },
  }: { loginCredintials: Pick<ReqUserType, "username" | "password"> },
  context: APIContextFnType
) => {
  const requiredValues = [
    { key: "username", value: username },
    { key: "password", value: password },
  ];

  for (let i = 0; i < requiredValues.length; i++) {
    if (!requiredValues[0].value)
      throw new GraphQLError(`${requiredValues[0].key} is required`, {
        extensions: {
          code: ApolloServerErrorCode.BAD_USER_INPUT,
        },
      });
  }

  return await handleConnectDB({
    async resolveCallback() {
      const userDoc = (
        await User.findOne({ username }).select(
          "_id username email address profilePicture coverPicture password"
        )
      )?._doc;

      if (!userDoc) {
        throw new GraphQLError("no user with this username", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      const comparePassword = await compare(password, userDoc.password);

      if (!comparePassword) {
        throw new GraphQLError("password incorrect", {
          extensions: { coded: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const token = await new SignJWT({
        id: userDoc._id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

      context.req.cookies.set("token", token);

      return { ...userDoc, password: undefined };
    },
    publicErrorMsg: "something went wrong while do this operation",
    showDatabaseErr: true,
  });
};

export default loginUser;
