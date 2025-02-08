import { NextResponse, type NextRequest } from "next/server";

// cloudinary
import { v2 as cloudinary } from "cloudinary";

// utils
import connectDB from "@/lib/connectDB";

export const POST = async ({ formData }: NextRequest) => {
  const data = await formData();

  const imgs = data.getAll("imgs[]") as unknown as File[];

  if (!imgs.length) {
    throw new Error("you must select some media to upload");
  }

  try {
    await connectDB();

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadFirstTime = imgs.map(
      (img) =>
        new Promise(async (res, rej) => {
          const buffer = new Uint8Array(await img.arrayBuffer());

          cloudinary.uploader
            .upload_stream({}, (err, resault) => {
              if (err) {
                rej(err);
                return;
              }

              res(resault);
            })
            .end(buffer);
        })
    );

    const finalImgsArr = await Promise.allSettled(uploadFirstTime);

    const test = finalImgsArr
      .filter((response) => response.status === "fulfilled")
      .map((response) => {
        if (!response.value) return;
        const imgData = response.value as Record<
          "secure_url" | "public_id",
          string
        >;

        return {
          public_id: imgData.public_id,
          secure_url: imgData.secure_url,
        };
      })
      .filter(Boolean);

    return NextResponse.json(test);
  } catch (err) {
    console.log(err);

    throw new Error("something went wrong while uploading your media");
  }
};
