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
    cache: new InMemoryCache(),
    uri: `${hostName}/api/graphql`,
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
export default ApolloContext;
