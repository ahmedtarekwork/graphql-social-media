// nextjs
import type { NextRequest } from "next/server";

// models
import Story from "../_models/story.model";

// utils
import { deleteMedia } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    const media = await Story.find({
      expiredData: {
        $lte: new Date().getTime(),
      },
    }).select("media");

    const IDs = media.map((media) => media._doc.public_id);

    const deleteRequest = Story.deleteMany({
      expiredData: {
        $lte: new Date().getTime(),
      },
    });

    await Promise.allSettled([deleteRequest, deleteMedia(IDs)]);

    return Response.json({ cronJobSuccess: true });
  } catch (error) {
    console.log("cron job error:", error);

    return Response.json({ cronJobSuccess: false }, { status: 500 });
  }
}
