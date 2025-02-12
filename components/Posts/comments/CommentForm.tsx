// react
import {
  useEffect,
  useRef,
  useState,

  // type
  type FormEvent,
  type Dispatch,
  type SetStateAction,
  type MutableRefObject,
} from "react";

// components
import FormMediaPreview, {
  type FormMediaPreviewRefType,
} from "../FormMediaPreview";

// shadcn
import { Button } from "../../ui/button";
import { Textarea } from "@/components/ui/textarea";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { toast } from "sonner";
import { nanoid } from "nanoid";
import classNames from "classnames";
import { uploadMedia } from "@/lib/utils";

// types
import type { CommentType } from "@/lib/types";

// icons
import { RiImageAddFill } from "react-icons/ri";

type Props = {
  setComments: Dispatch<SetStateAction<CommentType[]>>;
} & (
  | {
      mode: "edit";
      selectedCommentToEdit: Pick<CommentType, "_id" | "comment" | "media">;
      setMode: Dispatch<SetStateAction<"new" | "edit">>;
      setSelectedCommentToEdit: Dispatch<
        SetStateAction<Pick<CommentType, "_id" | "comment" | "media"> | null>
      >;

      postId?: never;
      setStopFetchMore?: never;
      skipCount?: never;
      fetchMoreLoading?: never;
    }
  | {
      mode: "new";
      postId: string;

      setMode?: never;
      setSelectedCommentToEdit?: never;
      selectedCommentToEdit?: never;
      setStopFetchMore: Dispatch<SetStateAction<boolean>>;
      skipCount: MutableRefObject<number>;
      fetchMoreLoading: boolean;
    }
);

const CommentForm = ({
  postId,
  mode,
  selectedCommentToEdit,
  setMode,
  setSelectedCommentToEdit,
  setStopFetchMore,
  skipCount,
  fetchMoreLoading,
  setComments,
}: Props) => {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const queryName = `${mode === "new" ? "add" : "edit"}Comment`;
  const queryUpperCaseName = `${mode === "new" ? "Add" : "Edit"}Comment`;
  const submitBtnContent = mode === "edit" ? "Update" : "Publish";

  const formRef = useRef<HTMLFormElement>(null);
  const mediaPreviewerRef = useRef<FormMediaPreviewRefType>(null);
  const isAddPost = useRef<boolean>(false);

  const SUBMIT_COMMENT = gql`
    mutation ${queryUpperCaseName}($${queryName}Data: ${queryUpperCaseName}Input!) {
      ${queryName}(${queryName}Data: $${queryName}Data) {
        ${
          mode === "edit"
            ? "message"
            : `
        _id
        comment
        createdAt

        media {
          public_id
          secure_url
        }

        owner {
          _id
          username
          profilePicture {
            secure_url
            public_id
          }
        }

        reactions {
          angry {
            count
          }
          like {
            count
          }
          love {
            count
          }
          sad {
            count
          }
        }`
        }
      }
    }
  `;

  const [submitComment, { loading }] = useMutation(SUBMIT_COMMENT, {
    onCompleted(data, options) {
      if (mode === "new") {
        setComments((prev) => [data?.[queryName], ...prev]);

        setStopFetchMore(() => {
          skipCount.current += 1;
          return false;
        });
      } else {
        setMode("new");
        setSelectedCommentToEdit(null);

        const newCommentInfo = options?.variables?.[`${queryName}Data`];

        setComments((prev) =>
          prev.map((comment: CommentType) => {
            if (
              comment._id.toString() === selectedCommentToEdit._id.toString()
            ) {
              return {
                ...comment,
                comment: newCommentInfo.comment || comment.comment,
                media: [
                  ...(selectedCommentToEdit.media || []),
                  ...(newCommentInfo.media || []),
                ],
              };
            }

            return comment;
          })
        );
      }

      mediaPreviewerRef.current?.setMedia([]);
      mediaPreviewerRef.current?.setOldMedia([]);

      const message =
        data?.[queryName]?.message ||
        `comment ${mode === "edit" ? "updated" : "published"} successfully`;

      toast.success(message, { duration: 6500 });
    },

    onError({ graphQLErrors }) {
      if (mode === "new") setStopFetchMore(false);

      toast.error(
        graphQLErrors?.[0]?.message ||
          "can't submit your comment at the momment",
        { duration: 7000 }
      );
    },
  });

  const handleSubmit = async () => {
    const comment = formRef.current?.comment.value;
    const media = mediaPreviewerRef.current?.media || [];

    const uploadMediaFunc = async () => {
      try {
        setUploadingMedia(true);

        const mediaArr = await uploadMedia(media.map(({ file }) => file));

        return mediaArr;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        toast.error("can't upload comment media at the momment", {
          duration: 7500,
        });
        return;
      } finally {
        setUploadingMedia(false);
      }
    };

    if (!comment && !media.length && mode === "new") {
      return toast.error("comment must have caption or at least one media", {
        duration: 7000,
      });
    }

    if (
      mode === "edit" &&
      comment === selectedCommentToEdit.comment &&
      !media.length
    ) {
      return toast.error("comment can't updated with same values", {
        duration: 7000,
      });
    }

    const uploadedMedia = media.length ? await uploadMediaFunc() : [];

    await submitComment({
      variables: {
        [`${queryName}Data`]: {
          ...(mode === "new"
            ? { postId }
            : { commentId: selectedCommentToEdit._id }),
          comment,
          media: uploadedMedia,
        },
      },
    });

    formRef.current?.reset();
  };

  const MediaPreviewerProps =
    mode === "new"
      ? { mode }
      : { mode, itemId: selectedCommentToEdit._id, setComments };

  useEffect(() => {
    if (mode === "edit" && selectedCommentToEdit?.media?.length)
      mediaPreviewerRef.current?.setOldMedia(selectedCommentToEdit.media);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommentToEdit]);

  useEffect(() => {
    if (mode === "edit" && selectedCommentToEdit.media?.length) {
      mediaPreviewerRef.current?.setOldMedia(selectedCommentToEdit.media);
    }
  }, [mode]);

  useEffect(() => {
    if (!fetchMoreLoading && isAddPost.current && mode === "new") {
      setStopFetchMore(true);
      submitComment();
      isAddPost.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMoreLoading]);

  return (
    <form
      ref={formRef}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();

        if (mode === "new") {
          if (!fetchMoreLoading) {
            setStopFetchMore(true);
            handleSubmit();
          } else isAddPost.current = true;

          return;
        }

        handleSubmit();
      }}
      className="w-[90%] mx-auto rounded-sm border-2 border-primary h-fit mt-auto space-y-2 sticky bottom-0 left-0 bg-white p-5 pt-2.5"
    >
      <FormMediaPreview
        disableBtns={loading || uploadingMedia}
        {...MediaPreviewerProps}
        type="comment"
        ref={mediaPreviewerRef}
      />

      <div className="flex gap-1 items-center flex-wrap max-md:flex-col">
        <Textarea
          placeholder="Comment..."
          className="flex-1"
          name="comment"
          defaultValue={
            mode === "edit" ? selectedCommentToEdit.comment || "" : ""
          }
          disabled={loading || uploadingMedia}
        />

        <input
          disabled={loading || uploadingMedia}
          type="file"
          className="hidden"
          id="add-media-to-comment"
          multiple
          accept="image/*"
          name="media"
          onChange={(e) => {
            const media = e?.target?.files;
            if (media?.length) {
              mediaPreviewerRef.current?.setMedia((prev) => [
                ...prev,
                ...Array.from(media).map((file) => ({
                  file,
                  id: nanoid(),
                })),
              ]);
            }
          }}
        />

        <Button
          asChild
          className={classNames(
            "max-md:w-full",
            loading || uploadingMedia
              ? "cursor-not-allowed bg-opacity-50"
              : "grid place-content-center cursor-pointer"
          )}
        >
          <label htmlFor="add-media-to-comment">
            <RiImageAddFill size={16} />
          </label>
        </Button>

        <Button
          disabled={loading || uploadingMedia}
          className="flex-[0.2] max-md:w-full"
        >
          {loading || uploadingMedia ? "Loading..." : submitBtnContent}
        </Button>
        {mode === "edit" && (
          <Button
            disabled={loading || uploadingMedia}
            className="flex-[0.2] red-btn max-md:w-full"
            type="button"
            onClick={() => {
              setSelectedCommentToEdit(null);
              setMode("new");
              formRef.current?.reset();
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
export default CommentForm;
