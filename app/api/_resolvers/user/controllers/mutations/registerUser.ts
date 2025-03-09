// types
import type { APIContextFnType, ReqUserType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { isEmail } from "validator";
import { SignJWT } from "jose";
import { genSalt, hash } from "bcrypt";

// models
import User from "../../../../_models/user.model";

const registerUser = async (
  _: unknown,
  {
    userData,
  }: {
    userData: Pick<
      ReqUserType,
      | "username"
      | "email"
      | "password"
      | "address"
      | "profilePicture"
      | "coverPicture"
    >;
  },
  context: APIContextFnType
) => {
  const email = userData.email;
  const username = userData.username;
  const password = userData.password;
  const address = userData.address;

  const requiredValues = [
    { key: "email", value: email },
    { key: "username", value: username },
    { key: "password", value: password },
    { key: "address", value: address },
  ];

  for (let i = 0; i < requiredValues.length; i++) {
    if (!requiredValues[i].value) {
      throw new GraphQLError(`${requiredValues[i].key} is required`, {
        extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
      });
    }
  }

  if (!isEmail(email)) {
    throw new GraphQLError("please insert a valid email", {
      extensions: {
        code: ApolloServerErrorCode.BAD_USER_INPUT,
      },
    });
  }

  if (password.length < 6) {
    throw new GraphQLError("password must be 6 or more characters", {
      extensions: {
        code: ApolloServerErrorCode.BAD_USER_INPUT,
      },
    });
  }

  return await handleConnectDB({
    async resolveCallback() {
      const existUser = await User.findOne({
        $or: [{ username }, { email }],
      }).select("username email");

      if (existUser) {
        const sameEmail = existUser.email === email;
        const sameUsername = existUser.username === username;

        const duplicatedValues = `${sameEmail ? "email" : ""}${
          sameEmail && sameUsername ? " and " : ""
        }${sameUsername ? `username` : ""}`;

        const errorMsg = `${duplicatedValues} is already taken`;

        throw new GraphQLError(errorMsg, {
          extensions: {
            code: ApolloServerErrorCode.BAD_REQUEST,
          },
        });
      }

      const hashedPassword = await hash(password, await genSalt());

      const newUser = await User.create({
        ...userData,
        password: hashedPassword,
      });

      const token = await new SignJWT({
        id: newUser._doc._id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

      context.req.cookies.set("token", token);

      return { ...newUser._doc, password: undefined };
    },
    publicErrorMsg: "something went wrong while register a new user",
    showDatabaseErr: true,
  });
};

export default registerUser;
