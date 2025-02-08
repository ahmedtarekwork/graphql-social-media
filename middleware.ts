import { NextResponse } from "next/server";

export async function middleware() {
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Origin",
    process.env.NODE_ENV === "development"
      ? process.env.DEVELOPMENT_APP_URL!
      : process.env.PRODUCTION_VERSION_URL!
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}
