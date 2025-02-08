import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uploadMedia = async (files: File[]) => {
  if (!files.length) throw new Error("you must select some media to upload");

  const formData = new FormData();
  files.forEach((file) => formData.append("imgs[]", file));

  try {
    const response = await fetch("/api/uploadMedia", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("");

    return await response.json();
  } catch (err) {
    console.log(err);

    throw new Error("something went wrong while upload media");
  }
};

export const updateMedia = async (
  media: {
    file: File;
    id: string;
  }[]
) => {
  if (!media.length)
    throw new Error("you must select some media to update them");
  const formData = new FormData();

  media.forEach(({ file, id }) => {
    formData.append(id, file);
    formData.append("ids[]", id);
  });

  try {
    const response = await fetch("/api/updateMedia", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("");

    return await response.json();
  } catch (err) {
    console.log(err);

    throw new Error("something went wrong while update media");
  }
};

export const deleteMedia = async (ids: string[]) => {
  if (!ids.length) throw new Error("you must select some media to delete");

  try {
    const response = await fetch(
      `${
        process.env.NODE_ENV === "development"
          ? process.env.NEXT_PUBLIC_DEVELOPMENT_APP_URL
          : process.env.NEXT_PUBLIC_PRODUCTION_VERSION_URL
      }/api/deleteMedia`,
      {
        method: "DELETE",
        body: JSON.stringify(ids),
      }
    );

    if (!response.ok) throw new Error("");

    return await response.json();
  } catch (err) {
    console.log(err);

    throw new Error("something went wrong while delete media");
  }
};
