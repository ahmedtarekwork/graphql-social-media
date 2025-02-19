// nextjs
import Image from "next/image";
import { useParams } from "next/navigation";

import {
  forwardRef,
  useContext,
  useImperativeHandle,
  useState,

  // types
  type Dispatch,
  type SetStateAction,
} from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import ImageWithLoading from "@/components/ImageWithLoading";

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
  FaFlag,
} from "react-icons/fa";
import { BsPersonPlusFill } from "react-icons/bs";
import { IoMdPerson } from "react-icons/io";
import { TbFlagPlus } from "react-icons/tb";

// types
import type {
  GroupType,
  ImageType,
  PageType,
  ReturnTypeOfUseQuery,
  UserType,
} from "@/lib/types";

// gql
import { type DocumentNode, gql, useMutation } from "@apollo/client";

// utils
import { updateMedia, uploadMedia } from "@/lib/utils";
import { toast } from "sonner";
import classNames from "classnames";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

export type ProfileAndCoverPictureOptionalProps =
  | {
      profileType: "personal";
      profileInfo: UserType;
      updateQuery?: never;
      normalUser?: never;
    }
  | {
      profileType: "page";
      profileInfo: PageType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
      normalUser: boolean;
    }
  | {
      profileType: "group";
      profileInfo: GroupType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
      normalUser: boolean;
    };

type Props = {
  pictureType: "profile" | "cover";
} & ProfileAndCoverPictureOptionalProps;

type ModesType = "firstTime" | "update";

export type ProfileAndCoverPictureRefType = {
  setNewPicture: Dispatch<SetStateAction<File | null>>;
  setMode: Dispatch<SetStateAction<ModesType>>;
};

const ProfileAndCoverPicture = forwardRef<ProfileAndCoverPictureRefType, Props>(
  ({ pictureType, profileType, profileInfo, updateQuery, normalUser }, ref) => {
    const pageId = (useParams()?.pageId || "") as string;

    const { setUser } = useContext(authContext);
    const isCurrentUserProfile = useIsCurrentUserProfile();

    const pictureName = `${pictureType}Picture` as keyof typeof profileInfo;

    let hasAccessToChangePicture = false;
    let NoProfilePictureIcon = BsPersonPlusFill;
    let NoProfilePictureIconWithoutAccess = IoMdPerson;
    let query: DocumentNode;

    const UPDATE_PERSONAL_PICTURE = gql`
      mutation ChangeUserData($newUserData: ChangeUserDataInput!) {
        changeUserData(newUserData: $newUserData) {
            ${pictureName} {
            public_id
            secure_url
          }
        }
      }
    `;
    const UPDATE_PAGE_PICTURE = gql`
      mutation ChangePageInfo($editPageData: EditPageInput!) {
        editPage(editPageData: $editPageData) {
          message
        }
      }
    `;

    switch (profileType) {
      case "personal": {
        if (isCurrentUserProfile) hasAccessToChangePicture = true;
        query = UPDATE_PERSONAL_PICTURE;

        break;
      }
      case "page": {
        if (!normalUser) hasAccessToChangePicture = true;

        if (!profileInfo.profilePicture) {
          NoProfilePictureIconWithoutAccess = FaFlag;
          NoProfilePictureIcon = TbFlagPlus;
        }

        query = UPDATE_PAGE_PICTURE;
        break;
      }
      case "group": {
        query = UPDATE_PAGE_PICTURE;

        break;
      }
    }

    const [uploadProfileOrCoverPicture, { loading: updatePictureLoading }] =
      useMutation(query, {
        onCompleted(data, options) {
          const newValues = options?.variables?.editPageData;

          switch (profileType) {
            case "personal": {
              const newPicture = data?.changeUserData?.[pictureName];

              if (newPicture) {
                setUser((prev) => ({
                  ...(prev as unknown as UserType),
                  [pictureName]: {
                    public_id: newPicture.public_id,
                    secure_url: newPicture.secure_url,
                  },
                }));
              }
              break;
            }

            case "page": {
              updateQuery((prev) => {
                return {
                  ...prev!,
                  getPageInfo: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...(prev as any)!.getPageInfo,
                    [pictureName]: {
                      public_id: newValues[pictureName].public_id,
                      secure_url: newValues[pictureName].secure_url,
                    },
                  },
                };
              });
              break;
            }
          }

          setNewPicture(null);
          if (mode !== "firstTime") setMode("firstTime");

          toast.success(`${pictureType} picture uploaded successfully`, {
            duration: 9000,
          });
        },
        onError({ graphQLErrors }) {
          toast.error(
            graphQLErrors?.[0]?.message ||
              `something went wrong while uploading your new ${pictureType} picture`,
            { duration: 9000 }
          );
        },
      });

    const [newPicture, setNewPicture] = useState<File | null>(null);
    const [disableBtns, setDisableBtns] = useState(false);
    const [mode, setMode] = useState<ModesType>("firstTime");

    const loading = disableBtns || updatePictureLoading;

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

    if (hasAccessToChangePicture) {
      if (newPicture) {
        return (
          <div className="flex flex-col items-center justify-center">
            <div
              className={classNames(
                pictureType === "profile" ? "w-[150px]" : "w-full",
                "relative h-[150px] p-1 bg-gradient-to-b from-white to-primary rounded-full"
              )}
            >
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
                      const oldImg = profileInfo?.[pictureName] as
                        | ImageType
                        | undefined;

                      return mode === "update" && oldImg?.public_id
                        ? updateMedia([
                            { file: newPicture, id: oldImg.public_id },
                          ])
                        : uploadMedia([newPicture]);
                    };

                    const newImg = await promise();

                    let variables: Record<string, unknown>;

                    switch (profileType) {
                      case "personal": {
                        variables = {
                          newUserData: {
                            [pictureName]: newImg[0],
                          },
                        };
                        break;
                      }
                      case "page": {
                        variables = {
                          editPageData: {
                            pageId,
                            [pictureName]: newImg[0],
                          },
                        };
                        break;
                      }
                      case "group": {
                        variables = {
                          newUserData: {
                            [pictureName]: newImg[0],
                          },
                        };
                        break;
                      }
                    }

                    uploadProfileOrCoverPicture({ variables });
                  } catch (_) {
                    toast.error(
                      `something went wrong while upload ${
                        profileType === "personal" ? "your" : "the"
                      } new ${pictureType} picture`,
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

      if (!profileInfo?.[pictureName]) {
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
                <NoProfilePictureIcon className="text-white block !w-full !h-full" />
              </label>
            )}
          </>
        );
      }
    }

    if (profileInfo?.[pictureName]) {
      return (
        <Dialog>
          <DialogTrigger
            className={classNames(
              pictureType === "cover"
                ? "w-full"
                : "p-1 bg-gradient-to-b from-white to-primary rounded-full w-[150px]",
              "h-[150px] relative group"
            )}
          >
            <div
              className={classNames(
                pictureType === "profile" ? "rounded-full" : "",
                "absolute z-10 bg-black bg-opacity-60 inset-0 grid place-content-center opacity-0 transition duration-200 pointer-events-none group-hover:opacity-100"
              )}
            >
              <FaEye size={25} fill="white" />
            </div>

            <ImageWithLoading
              src={(profileInfo[pictureName] as ImageType).secure_url}
              {...imageProps}
              alt={`${pictureType} picture`}
              customSize={100}
              priority
              spinnerFill={pictureType === "cover" ? "primary" : "white"}
            />
          </DialogTrigger>
          <DialogContent
            aria-describedby="content"
            className="bg-transparent border-0"
          >
            <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>{pictureType} picture</DialogTitle>
                <DialogDescription>{pictureType} picture</DialogDescription>
              </VisuallyHidden>

              <div className="relative h-full">
                <ImageWithLoading
                  src={(profileInfo[pictureName] as ImageType)?.secure_url}
                  fill
                  className="object-contain aspect-[1]"
                  alt={`${pictureType} picture`}
                  spinnerFill="white"
                />
              </div>
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
        <NoProfilePictureIconWithoutAccess className="text-white block !w-full !h-full" />
      </div>
    );
  }
);

ProfileAndCoverPicture.displayName = "ProfileAndCoverPicture";

export default ProfileAndCoverPicture;
