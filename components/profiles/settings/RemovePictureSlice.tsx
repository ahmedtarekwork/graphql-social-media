// react
import { useContext } from "react";

// shadcn
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
import { Button } from "@/components/ui/button";

// contexts
import { authContext } from "@/contexts/AuthContext";

// gql
import { gql, useMutation } from "@apollo/client";

// icons
import { IoMdRemoveCircle } from "react-icons/io";

// utils
import { toast } from "sonner";

// types
import type { UserType } from "@/lib/types";

type Props = {
  pictureType: "cover" | "profile";
};

const RemovePictureSlice = ({ pictureType }: Props) => {
  const { user, setUser } = useContext(authContext);

  const REMOVE_PICTURE = gql`
    mutation RemovePicture($pictureType: PicturesTypes!) {
      removeUserProfileOrCoverPicture(pictureType: $pictureType) {
        message
      }
    }
  `;

  const [removePicture, { loading }] = useMutation(REMOVE_PICTURE, {
    onCompleted() {
      setUser(
        (prev) => ({ ...prev, [`${pictureType}Picture`]: null } as UserType)
      );

      toast.success(`your ${pictureType} picture removed successfully`, {
        duration: 8000,
      });
    },

    onError({ graphQLErrors }) {
      let message = `something went wrong while removing your ${pictureType} picture`;
      if (graphQLErrors.length) message = graphQLErrors[0].message;

      toast.error(message, { duration: 8000 });
    },
  });

  return (
    <div className="setting-slice bg-red-300 border-l-red-800">
      <p>remove {pictureType} picture</p>

      <AlertDialog>
        <Button
          asChild
          className="red-btn"
          disabled={
            loading || !user?.[`${pictureType}Picture` as keyof typeof user]
          }
        >
          <AlertDialogTrigger>
            <IoMdRemoveCircle />
            {loading ? "Loading..." : "remove"}
          </AlertDialogTrigger>
        </Button>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              you will remove your {pictureType} picture finally without
              restoration, <br />
              you can upload another one any time
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              asChild
              className="red-btn"
              onClick={() =>
                removePicture({
                  variables: { pictureType },
                })
              }
            >
              <AlertDialogAction>
                <IoMdRemoveCircle />
                Remove
              </AlertDialogAction>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default RemovePictureSlice;
