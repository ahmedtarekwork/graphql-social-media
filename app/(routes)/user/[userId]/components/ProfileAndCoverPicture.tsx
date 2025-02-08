// nextjs
import Image from "next/image";

import {
  forwardRef,
  useImperativeHandle,
  useState,

  // types
  type Dispatch,
  type SetStateAction,
} from "react";

// components
// shadcn
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// icons
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaArrowCircleUp,
} from "react-icons/fa";
import { BsPersonPlusFill } from "react-icons/bs";
import { IoMdPerson } from "react-icons/io";

// types
import type { ImageType, UserType } from "@/lib/types";

// gql
import { gql, useMutation } from "@apollo/client";

// utils
import { updateMedia, uploadMedia } from "@/lib/utils";
import { toast } from "sonner";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

type Props = {
  user: UserType;
  setUser: Dispatch<SetStateAction<UserType | null>>;
  pictureType: "profile" | "cover";
};

type ModesType = "firstTime" | "update";

export type ProfileAndCoverPictureRefType = {
  setNewPicture: Dispatch<SetStateAction<File | null>>;
  setMode: Dispatch<SetStateAction<ModesType>>;
};

const ProfileAndCoverPicture = forwardRef<ProfileAndCoverPictureRefType, Props>(
  ({ setUser, user, pictureType }, ref) => {
    const isCurrentUserProfile = useIsCurrentUserProfile();

    const pictureName = `${pictureType}Picture` as keyof typeof user;

    const UPDATE_COVER_PICTURE = gql`
      mutation ChangeUserData($newUserData: ChangeUserDataInput!) {
        changeUserData(newUserData: $newUserData) {
            ${pictureName} {
            public_id
            secure_url
          }
        }
      }
    `;

    const [addNewPicture, { loading: addNewPictureLoading }] = useMutation(
      UPDATE_COVER_PICTURE,
      {
        onCompleted(data) {
          const newPicture = data.changeUserData?.[pictureName];

          if (newPicture) {
            setUser((prev) => ({
              ...(prev as unknown as UserType),
              [pictureName]: {
                public_id: newPicture.public_id,
                secure_url: newPicture.secure_url,
              },
            }));
            setNewPicture(null);
            if (mode !== "firstTime") setMode("firstTime");
          } else {
            toast.error(
              `something went wrong while uploading your new ${pictureType} picture`,
              { duration: 9000 }
            );
          }
        },
        onError(error) {
          console.log(error);
          toast.error(
            `something went wrong while uploading your new ${pictureType} picture`,
            { duration: 9000 }
          );
        },
      }
    );

    const [newPicture, setNewPicture] = useState<File | null>(null);
    const [disableBtns, setDisableBtns] = useState(false);
    const [mode, setMode] = useState<ModesType>("firstTime");

    const loading = disableBtns || addNewPictureLoading;

    useImperativeHandle(ref, () => ({ setNewPicture, setMode }), []);

    const imageProps =
      pictureType === "cover"
        ? {
            fill: true,
            className: "w-full h-full object-cover aspect-[1]",
          }
        : {
            width: 150,
            height: 150,
            className: "rounded-full aspect-[1] object-cover w-full h-full",
          };

    if (isCurrentUserProfile) {
      if (newPicture) {
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-[150px] w-[150px] p-1 bg-gradient-to-b from-white to-primary rounded-full">
              <Image
                src={URL.createObjectURL(newPicture)}
                {...imageProps}
                alt={`new ${pictureType} picture preview`}
              />
            </div>

            <div className="flex gap-1 my-2 flex-wrap [&>*]:flex-1">
              <Button
                disabled={loading}
                onClick={async () => {
                  try {
                    setDisableBtns(true);
                    const promise = () => {
                      const oldImg = user[pictureName] as ImageType;

                      return mode === "update" && oldImg?.public_id
                        ? updateMedia([
                            { file: newPicture, id: oldImg.public_id },
                          ])
                        : uploadMedia([newPicture]);
                    };

                    const newImg = await promise();

                    addNewPicture({
                      variables: {
                        newUserData: {
                          [pictureName]: newImg[0],
                        },
                      },
                    });
                  } catch (err) {
                    console.log(err);
                    toast.error(
                      `something went wrong while upload your new ${pictureType} picture`,
                      { duration: 9000 }
                    );
                  } finally {
                    setDisableBtns(false);
                  }
                }}
              >
                {mode === "firstTime" ? (
                  <>
                    <FaCheckCircle />
                    {loading ? "Loading..." : "Submit"}
                  </>
                ) : (
                  <>
                    <FaArrowCircleUp />
                    {loading ? "Loading..." : "Update"}
                  </>
                )}
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-500"
                onClick={() => {
                  setNewPicture(null);
                  if (mode !== "firstTime") setMode("firstTime");
                }}
                disabled={loading}
              >
                <FaTimesCircle />
                Cancel
              </Button>
            </div>
          </div>
        );
      }

      if (!user[pictureName]) {
        return (
          <>
            <input
              type="file"
              id={`choose-${pictureType}-pricture`}
              className="hidden"
              onChange={(e) => {
                const picture = e.target.files?.[0];
                if (picture) setNewPicture(picture);
              }}
            />

            {pictureType === "cover" ? (
              <Button asChild className="rounded-none">
                <label
                  htmlFor={`choose-${pictureType}-pricture`}
                  className="grid place-content-center h-[150px] p-4 cursor-pointer"
                >
                  <p className="font-semibold text-white text-lg">
                    <span className="block text-4xl font-bold text-center">
                      +
                    </span>{" "}
                    Add {pictureType + " "}
                    picture
                  </p>
                </label>
              </Button>
            ) : (
              <label
                htmlFor="choose-profile-pricture"
                className="block cursor-pointer border-[3px] shadow-sm shadow-primary border-white max-w-[130px] w-[130px] max-h-[130px] h-[130px] p-4 bg-primary rounded-full hover:bg-secondary transition duration-200"
              >
                <BsPersonPlusFill className="text-white block !w-full !h-full" />
              </label>
            )}
          </>
        );
      }
    }

    if (user[pictureName]) {
      return (
        <Dialog>
          <DialogTrigger
            className={`${
              pictureType === "cover"
                ? "w-full"
                : "p-1 bg-gradient-to-b from-white to-primary rounded-full w-[150px]"
            } h-[150px] relative group`}
          >
            <div
              className={`${
                pictureType === "profile" ? "rounded-full " : ""
              }absolute z-10 bg-black bg-opacity-60 inset-0 grid place-content-center opacity-0 transition duration-200 pointer-events-none group-hover:opacity-100`}
            >
              <FaEye size={25} fill="white" />
            </div>

            <Image
              src={(user[pictureName] as ImageType).secure_url}
              {...imageProps}
              alt={`${pictureType} picture`}
              priority
            />
          </DialogTrigger>
          <DialogContent
            aria-describedby="content"
            className="bg-transparent border-0"
          >
            <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>{pictureType} picture</DialogTitle>
              </VisuallyHidden>

              <DialogDescription>
                <Image
                  src={(user[pictureName] as ImageType)?.secure_url}
                  fill
                  className="object-contain aspect-[1]"
                  alt={`${pictureType} picture`}
                />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
    }

    if (pictureType === "cover") {
      return (
        <div className="bg-primary h-[150px] w-full text-white font-bold text-2xl grid place-content-center">
          No {pictureType} picture !
        </div>
      );
    }

    return (
      <div className="border-[3px] shadow-sm shadow-primary border-white max-w-[130px] w-[130px] max-h-[130px] h-[130px] p-4 bg-primary rounded-full">
        <IoMdPerson className="text-white block !w-full !h-full" />
      </div>
    );
  }
);

ProfileAndCoverPicture.displayName = "ProfileAndCoverPicture";

export default ProfileAndCoverPicture;
