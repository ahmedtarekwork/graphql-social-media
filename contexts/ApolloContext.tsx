"use client";

// react
import { type ReactNode } from "react";

// apollo
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const ApolloContext = ({ children }: { children: ReactNode }) => {
  const hostName =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEVELOPMENT_APP_URL
      : process.env.NEXT_PUBLIC_PRODUCTION_VERSION_URL;

  const client = new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            getCurrentUserPosts: {
              keyArgs: false,
              merge(existing = { posts: [], isFinalPage: false }, incoming) {
                const postsMap = new Map([]);

                // Add existing posts to the map
                existing.posts.forEach((post: { __ref: string }) => {
                  postsMap.set(post.__ref, post);
                });

                // Add incoming posts to the map, replacing any duplicates
                incoming.posts.forEach((post: { __ref: string }) => {
                  postsMap.set(post.__ref, post);
                });

                return {
                  ...incoming,
                  posts: Array.from(postsMap.values()),
                };
              },
            },
          },
        },
      },
    }),
    uri: `${hostName}/api/graphql`,
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
export default ApolloContext;
