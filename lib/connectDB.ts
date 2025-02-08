import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";
import { connect, connection } from "mongoose";

const connectDB = async (): Promise<void | GraphQLError> => {
  "use server";

  const connectCode = connection.readyState;

  switch (connectCode) {
    case 1: {
      console.log("connected alreay");
      return;
    }
    case 2: {
      console.log("connecting...");
      return;
    }
  }

  try {
    await connect(process.env.MONGO_CONNECTION_URI!, {
      dbName: "Social_Media_App",
      bufferCommands: true,
    });

    console.log("connected");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  } catch (err: any) {
    console.log(err);

    throw new GraphQLError(
      "something went wrong while connecting to database",
      {
        extensions: {
          code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
        },
      }
    );
  }
};

export default connectDB;
