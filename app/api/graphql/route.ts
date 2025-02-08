// graphql
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";

import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";

// resolvers
import userResolvers from "../_resolvers/user.resolver";
import postResolvers from "../_resolvers/post.resolver";
import commentResolvers from "../_resolvers/comment.resolver";
import pageResolvers from "../_resolvers/page.resolver";
import storyResolvers from "../_resolvers/story.resolver";
import groupResolvers from "../_resolvers/group.resolver";

// typeDefs
import publicTypeDefs from "../_typeDefs/public.typeDefs";
import userTypeDefs from "../_typeDefs/user.typeDefs";
import postTypeDefs from "../_typeDefs/post.typeDefs";
import commentTypeDefs from "../_typeDefs/comment.typeDefs";
import pageTypeDefs from "../_typeDefs/page.typeDefs";
import groupTypeDefs from "../_typeDefs/group.typeDefs";
import storyTypeDefs from "../_typeDefs/story.typeDefs";

// typescript types
import type { NextRequest } from "next/server";
import type { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";

const schema = buildSubgraphSchema({
  resolvers: mergeResolvers([
    userResolvers,
    postResolvers,
    commentResolvers,
    pageResolvers,
    groupResolvers,
    storyResolvers,
  ]) as GraphQLResolverMap<unknown>,
  typeDefs: mergeTypeDefs([
    publicTypeDefs,
    userTypeDefs,
    postTypeDefs,
    commentTypeDefs,
    pageTypeDefs,
    groupTypeDefs,
    storyTypeDefs,
  ]),
});

const server = new ApolloServer({ schema });

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export const GET = async (req: NextRequest) => {
  const response = await handler(req);

  const token = req.cookies.get("token")?.value;

  if (token) {
    response.headers.set(
      "Set-Cookie",
      `${"ahmed-social-media-app-user-token"}=${token}; Path=/; HttpOnly; Secure=${
        process.env.NODE_ENV !== "development"
      }; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    );
  }

  return response;
};

export const POST = async (req: NextRequest) => {
  const response = await handler(req);

  const token = req.cookies.get("token")?.value;

  if (token) {
    response.headers.set(
      "Set-Cookie",
      `${"ahmed-social-media-app-user-token"}=${token}; Path=/; HttpOnly; Secure=${
        process.env.NODE_ENV !== "development"
      }; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    );
  }

  return response;
};
