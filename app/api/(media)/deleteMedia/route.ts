// nextjs
import { NextResponse, type NextRequest } from "next/server";

// cloudinary
import { v2 as cloudinary } from "cloudinary";

// utils
import connectDB from "@/lib/connectDB";

export const DELETE = async ({ json }: NextRequest) => {
  const imgsIds = (await json()) as string[];

  if (!imgsIds.length) {
    throw new Error("you must select some images to delete it");
  }

  try {
    await connectDB();

    if (!imgsIds || !imgsIds.length) {
      throw new Error("you need to select images to delete");
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const res = await cloudinary.api.delete_resources(imgsIds, {
      type: "upload",
      resource_type: "image",
    });

    return NextResponse.json(
      Object.entries(res.deleted)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, value]) => value === "deleted")
        .map(([key]) => key)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.log(err);

    if ("message" in err) {
      throw new Error(err.message);
    }

    throw new Error("something went wrong while uploading your images");
  }
};
