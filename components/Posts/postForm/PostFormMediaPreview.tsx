// nextjs
import Image from "next/image";

// react
import {
  forwardRef,
  useState,
  useImperativeHandle,
  memo,

  // types
  type Dispatch,
  type SetStateAction,
} from "react";

// components
import DeleteMediaFromPostBtn from "./DeleteMediaFromPostBtn";

// shadcn
import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// icons
import { FaTrash } from "react-icons/fa6";

// types
import type { ImageType } from "@/lib/types";

type MediaType = { file: File; id: string };

type ModeType =
  | {
      mode: "edit";
      postId: string;
    }
  | {
      mode: "new";
      postId?: never;
    };

export type PostFormMediaPreviewRefType = {
  setMedia: Dispatch<SetStateAction<MediaType[]>>;
  media: MediaType[];
  oldMedia: ImageType[];
  setOldMedia: Dispatch<SetStateAction<ImageType[]>>;
};

type Props = { disableBtns: boolean } & ModeType;

const PostFormMediaPreview = forwardRef<PostFormMediaPreviewRefType, Props>(
  ({ disableBtns, postId, mode }, ref) => {
    const [media, setMedia] = useState<MediaType[]>([]);
    const [oldMedia, setOldMedia] = useState<ImageType[]>([]);

    useImperativeHandle(
      ref,
      () => ({ media, setMedia, oldMedia, setOldMedia }),
      [media, oldMedia]
    );

    if (!media.length && !oldMedia.length) return;

    return (
      <ul className="flex flex-wrap gap-2">
        {mode === "edit" &&
          oldMedia.map(({ public_id, secure_url }, i) => (
            <li
              key={public_id}
              className="rounded-sm shadow-md overflow-hidden border-2 border-primary p-0.5 space-y-1"
            >
              <Image
                src={secure_url}
                alt={`post media No.${i + 1}`}
                width={100}
                height={100}
                className="aspect-[1] object-contain"
                priority
              />
              <DeleteMediaFromPostBtn
                disableBtns={disableBtns}
                postId={postId}
                setOldMedia={setOldMedia}
                mediaId={public_id}
              />
            </li>
          ))}

        {media.map(({ file, id }, i) => (
          <li
            key={id}
            className="rounded-sm shadow-md overflow-hidden border-2 border-primary p-0.5 space-y-1"
          >
            <Image
              src={URL.createObjectURL(file)}
              alt={`post media No.${i + 1}`}
              width={100}
              height={100}
              className="aspect-[1] object-contain"
            />
            <div className="border-t-2 border-primary pt-1">
              <AlertDialog>
                <Button
                  asChild
                  className="red-btn w-full"
                  disabled={disableBtns}
                >
                  <AlertDialogTrigger>
                    <FaTrash size={18} />
                  </AlertDialogTrigger>
                </Button>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure about remove this media?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You can later add this media again after removing it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={disableBtns}
                      className="red-btn"
                      onClick={() =>
                        setMedia((prev) =>
                          prev.filter(({ id: prevId }) => prevId !== id)
                        )
                      }
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
    );
  }
);

PostFormMediaPreview.displayName = "PostFormMediaPreview";

export default memo(PostFormMediaPreview);
