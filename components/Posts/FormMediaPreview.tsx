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
import DeleteMediaFromPostOrCommentBtn from "./DeleteMediaFromPostOrCommentBtn";
import ImageWithLoading from "../ImageWithLoading";

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
import type { CommentType, ImageType } from "@/lib/types";
import { FaClock } from "react-icons/fa";

type MediaType = { file: File; id: string };

type EditModeType = {
  mode: "edit";
  itemId: string;
} & (
  | {
      type: "post";
      setComments?: never;
    }
  | {
      type: "comment";
      setComments: Dispatch<SetStateAction<CommentType[]>>;
    }
);

type ModeType =
  | EditModeType
  | {
      mode: "new";
      itemId?: never;
      type: "post" | "comment";
      setComments?: never;
    };

export type FormMediaPreviewRefType = {
  setMedia: Dispatch<SetStateAction<MediaType[]>>;
  media: MediaType[];
  oldMedia: ImageType[];
  setOldMedia: Dispatch<SetStateAction<ImageType[]>>;
};

type Props = { disableBtns: boolean } & ModeType;

const FormMediaPreview = forwardRef<FormMediaPreviewRefType, Props>(
  ({ disableBtns, itemId, mode, type, setComments }, ref) => {
    const [media, setMedia] = useState<MediaType[]>([]);
    const [oldMedia, setOldMedia] = useState<ImageType[]>([]);

    useImperativeHandle(
      ref,
      () => ({ media, setMedia, oldMedia, setOldMedia }),
      [media, oldMedia]
    );

    if (!media.length && !oldMedia.length) return;

    const someOfDeleteOldMediaBtnProps =
      type === "comment"
        ? { type, setComments: setComments! }
        : {
            type,
          };

    return (
      <ul className="flex flex-wrap gap-2">
        {mode === "edit" &&
          oldMedia.map(({ public_id, secure_url }, i) => (
            <li
              key={public_id}
              className="rounded-sm shadow-md overflow-hidden border-2 border-primary p-0.5 space-y-1"
            >
              <ImageWithLoading
                src={secure_url}
                alt={`post media No.${i + 1}`}
                width={100}
                height={100}
                className="aspect-[1] object-contain"
                priority
              />
              <DeleteMediaFromPostOrCommentBtn
                disableBtns={disableBtns}
                itemId={itemId}
                setOldMedia={setOldMedia}
                mediaId={public_id}
                {...someOfDeleteOldMediaBtnProps}
              />
            </li>
          ))}

        {media.map(({ file, id }, i) => (
          <li
            key={id}
            className="rounded-sm shadow-md overflow-hidden border-2 border-primary p-0.5 space-y-1 relative"
          >
            <div className="bg-accent rounded-full grid place-content-center size-[22px] absolute -top-[15px] -right-[15px] border border-primary border-opacity-40">
              <FaClock size={16} className="fill-primary" />
            </div>

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

FormMediaPreview.displayName = "FormMediaPreview";

export default memo(FormMediaPreview);
