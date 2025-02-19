import { NextResponse, type NextRequest } from "next/server";

// cloudinary
import { v2 as cloudinary } from "cloudinary";

// utils
import connectDB from "@/lib/connectDB";

export const POST = async ({ formData }: NextRequest) => {
  const data = await formData();

  const imgsIDs = data.getAll("ids[]") as string[];

  if (!imgsIDs.length) {
    throw new Error("you must select some media to update");
  }

  try {
    await connectDB();

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const updatedMedia = imgsIDs.map((id) => {
      const img = data.get(id) as File;
      if (!img) return;

      return new Promise(async (res, rej) => {
        const editData = { public_id: id, invalidate: true };

        const buffer = new Uint8Array(await img.arrayBuffer());

        cloudinary.uploader
          .upload_stream(editData, (err, result) => {
            if (err) {
              rej(err);
              return;
            }

            res(
              JSON.parse(JSON.stringify(result, ["public_id", "secure_url"]))
            );
          })
          .end(buffer);
      });
    });

    const finalImgsArr = await Promise.allSettled(updatedMedia);

    return NextResponse.json(
      finalImgsArr
        .filter((res) => res.status === "fulfilled")
        .map((res) => res.value)
    );
  } catch (err) {
    console.log(err);

    throw new Error("something went wrong while updating your media");
  }
};
