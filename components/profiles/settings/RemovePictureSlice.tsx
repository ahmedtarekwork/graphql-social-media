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
import { type DocumentNode, gql, useMutation } from "@apollo/client";

// icons
import { IoMdRemoveCircle } from "react-icons/io";

// utils
import { toast } from "sonner";

// types
import { type ProfileSettingsProfileTypeProps } from "./ProfileSettings";
import { useParams } from "next/navigation";

type Props = {
  pictureType: "cover" | "profile";
  profile: Omit<ProfileSettingsProfileTypeProps, "setOpenSettings">;
};

const RemovePictureSlice = ({ pictureType, profile }: Props) => {
  const { profileType, updateQuery, profileInfo } = profile;

  const pageId = (useParams()?.pageId || "") as string;

  const pictureName = `${pictureType}Picture`;

  const { setUser } = useContext(authContext);

  const REMOVE_USER_PICTURE = gql`
    mutation RemoveUserPicture($pictureType: PicturesTypes!) {
      removeUserProfileOrCoverPicture(pictureType: $pictureType) {
        message
      }
    }
  `;
  const REMOVE_PAGE_PICTURE = gql`
    mutation RemovePagePicture($removePictureInfo: RemovePictureInfoInput!) {
      removePageProfileOrCoverPicture(removePictureInfo: $removePictureInfo) {
        message
      }
    }
  `;

  let query: DocumentNode;

  switch (profileType) {
    case "personal": {
      query = REMOVE_USER_PICTURE;
      break;
    }
    case "page": {
      query = REMOVE_PAGE_PICTURE;
      break;
    }
    case "group": {
      query = REMOVE_PAGE_PICTURE;
      break;
    }
  }

  const [removePicture, { loading }] = useMutation(query, {
    onCompleted() {
      switch (profileType) {
        case "personal": {
          setUser((prev) => ({ ...prev!, [`${pictureType}Picture`]: null }));
          break;
        }
        case "page": {
          updateQuery?.((prev) => ({
            ...prev!,
            getPageInfo: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(prev as any)!.getPageInfo,
              [pictureName]: null,
            },
          }));
          break;
        }
      }

      toast.success(
        `${
          profileType === "personal" ? "your" : profileType
        } ${pictureType} picture removed successfully`,
        {
          duration: 8000,
        }
      );
    },

    onError({ graphQLErrors }) {
      let message = `something went wrong while removing ${
        profileType === "personal" ? "your" : profileType
      } ${pictureType} picture`;
      if (graphQLErrors.length) message = graphQLErrors[0].message;

      toast.error(message, { duration: 8000 });
    },
  });

  return (
    <div className="red-setting-slice">
      <p>remove {pictureType} picture</p>

      <AlertDialog>
        <Button
          asChild
          className="red-btn"
          disabled={
            loading || !profileInfo?.[pictureName as keyof typeof profileInfo]
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
              onClick={() => {
                let variables: Record<string, unknown>;

                switch (profileType) {
                  case "personal": {
                    variables = { pictureType };
                    break;
                  }
                  case "page": {
                    variables = {
                      removePictureInfo: {
                        pageId,
                        pictureType,
                      },
                    };
                    break;
                  }
                  case "group": {
                    variables = { pictureType };
                    break;
                  }
                }

                removePicture({
                  variables,
                });
              }}
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
