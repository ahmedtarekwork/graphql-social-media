// react
import { useContext, type Dispatch, type SetStateAction } from "react";

// contexts
import { PostsContext } from "@/contexts/PostsContext";

// components
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

// types
import type { ImageType } from "@/lib/types";

// utils
import { toast } from "sonner";

// gql
import { gql, useMutation } from "@apollo/client";

// icons
import { FaTrash } from "react-icons/fa";

type Props = {
  mediaId: string;
  disableBtns: boolean;
  setOldMedia: Dispatch<SetStateAction<ImageType[]>>;
  postId: string;
};

const DELETE_MEDIA_FROM_POST = gql`
  mutation DeleteMediaFromPost($mediaData: DeleteMediaFromItemInput!) {
    deleteMediaFromPost(mediaData: $mediaData) {
      message
    }
  }
`;

const DeleteMediaFromPostBtn = ({
  setOldMedia,
  mediaId,
  postId,
  disableBtns,
}: Props) => {
  const { setData } = useContext(PostsContext);

  const [deleteMedia, { loading }] = useMutation(DELETE_MEDIA_FROM_POST, {
    variables: {
      mediaData: {
        itemId: postId,
        publicIds: [mediaId],
      },
    },

    onCompleted(data) {
      setOldMedia?.((prev) =>
        prev.filter(({ public_id: id }) => mediaId !== id)
      );

      // TODO: FIX BUG WHEN REMOVE MEDIA IT STILL NOT REMOVED
      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((post) => {
          if (post._id.toString() === postId.toString()) {
            return {
              ...post,
              media: (post.media || [])?.filter(
                ({ public_id }) => public_id !== mediaId
              ),
            };
          }

          return post;
        }),
      }));

      toast.success(
        data?.deleteMediaFromPost?.message || "media deleted successfully",
        { duration: 7500 }
      );
    },

    onError({ graphQLErrors }) {
      toast.error(
        graphQLErrors?.[0]?.message ||
          "something went wrong while delete the media",
        {
          duration: 7500,
        }
      );
    },
  });

  return (
    <div className="border-t-2 border-primary p-1">
      <AlertDialog>
        <Button className="red-btn w-full" asChild>
          <AlertDialogTrigger disabled={disableBtns || loading}>
            {loading ? "Deleting..." : <FaTrash size={18} />}
          </AlertDialogTrigger>
        </Button>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure about delete this media?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This media will delete for ever, You can later add this media
              again after delete it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading || disableBtns}
              className="red-btn"
              onClick={() => deleteMedia()}
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default DeleteMediaFromPostBtn;
