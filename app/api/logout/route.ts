import { cookies } from "next/headers";

export const GET = () => {
  cookies().delete("ahmed-social-media-app-user-token");

  return Response.json({ success: true });
};
