// react
import { useContext, type ReactNode, type RefObject } from "react";

// components
import FriendshipBtns from "@/app/(routes)/user/[userId]/components/FriendshipBtns";
import TogglePageFollow from "../pages/TogglePageFollow";

import PageAndGroupSettings, {
  type PageAndGroupSettingsProfileType,
} from "./settings/PageAndGroupSettings";

import ProfileAndCoverPicture, {
  type ProfileAndCoverPictureOptionalProps,
  type ProfileAndCoverPictureRefType,
} from "./ProfileAndCoverPicture";

// contexts
import { authContext } from "@/contexts/AuthContext";

// shadcn
import { Button } from "../ui/button";

// types
import type {
  GroupType,
  PageType,
  ReturnTypeOfUseQuery,
  UserType,
} from "@/lib/types";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

// utils
import { toast } from "sonner";

type Props = {
  coverPictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profilePictureRef: RefObject<ProfileAndCoverPictureRefType>;
} & (
  | {
      profileType: "personal";
      profileInfo: UserType;
      updateQuery?: never;
      isUserAdminUpdateQuery?: never;
      normalUser?: never;
      isUserOwner?: never;
    }
  | {
      profileType: "page";
      profileInfo: PageType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
      isUserAdminUpdateQuery: ReturnTypeOfUseQuery["updateQuery"];
      normalUser: boolean;
      isUserOwner: boolean;
    }
  | {
      profileType: "group";
      profileInfo: GroupType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
      isUserAdminUpdateQuery: ReturnTypeOfUseQuery["updateQuery"];
      normalUser: boolean;
      isUserOwner: boolean;
    }
);

const ProfileTopInfo = ({
  coverPictureRef,
  profilePictureRef,
  profileInfo,
  profileType,
  updateQuery,
  isUserAdminUpdateQuery,
  normalUser,
  isUserOwner,
}: Props) => {
  const { user } = useContext(authContext);
  const isCurrentUserProfile = useIsCurrentUserProfile();

  const values: Record<"name" | "secondaryText", ReactNode> = {
    name: "",
    secondaryText: "",
  };

  let profileAndCoverPictureProps: ProfileAndCoverPictureOptionalProps;

  switch (profileType) {
    case "personal": {
      values.name = profileInfo.username;
      values.secondaryText = profileInfo.email;

      profileAndCoverPictureProps = {
        profileType,
        profileInfo,
      };

      break;
    }

    case "page": {
      values.name = profileInfo.name;
      values.secondaryText = (
        <p className="text-gray-600 text-md truncate">
          <b className="text-primary">{profileInfo.followersCount}</b> followers
        </p>
      );

      profileAndCoverPictureProps = {
        profileType,
        profileInfo,
        updateQuery,
        normalUser: true,
      };
      break;
    }

    case "group": {
      values.name = profileInfo.name;
      values.secondaryText = (
        <p className="text-gray-600 text-md truncate">
          <b className="text-primary">{profileInfo.membersCount}</b> members
        </p>
      );

      profileAndCoverPictureProps = {
        profileType,
        profileInfo,
        updateQuery,
        normalUser: true,
      };
      break;
    }
  }

  switch (profileType) {
    case "group":
    case "page": {
      profileAndCoverPictureProps.normalUser = normalUser;
      break;
    }
  }

  return (
    <div className="relative mb-4">
      <ProfileAndCoverPicture
        ref={coverPictureRef}
        pictureType="cover"
        {...profileAndCoverPictureProps}
      />

      <div className="mt-3 flex gap-4 justify-between flex-wrap max-sm:flex-col max-sm:justify-center items-center">
        <div className="flex items-center gap-2 max-sm:flex-col">
          <ProfileAndCoverPicture
            ref={profilePictureRef}
            pictureType="profile"
            {...profileAndCoverPictureProps}
          />

          <div className="space-y-2 ">
            <h2 className="font-bold text-2xl text-secondary">{values.name}</h2>

            {typeof values.secondaryText === "string" ? (
              <p className="text-gray-600 text-md truncate">
                {values.secondaryText}
              </p>
            ) : (
              values.secondaryText
            )}

            {profileType === "personal" && (
              <>
                <FriendshipBtns userId={profileInfo._id} />

                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(profileInfo._id);
                      toast.success("id copied successfully");
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (_) {
                      toast.error("can't copy id at the momment");
                    }
                  }}
                >
                  Copy {isCurrentUserProfile ? "your" : "user"} ID
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${document.location.origin}/user/${profileInfo._id}`
                      );
                      toast.success("URL copied successfully");
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (_) {
                      toast.error("can't copy URL at the momment");
                    }
                  }}
                >
                  Copy profile URL
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap max-sm:mx-auto">
          {profileType === "page" ? (
            profileInfo.owner._id !== user?._id && <TogglePageFollow />
          ) : (
            <></>
          )}

          {profileType !== "personal" && !normalUser && (
            <PageAndGroupSettings
              coverPictureRef={coverPictureRef}
              profilePictureRef={profilePictureRef}
              profile={
                {
                  profileType: profileType,
                  profileInfo: profileAndCoverPictureProps.profileInfo,
                  updateQuery,
                } as PageAndGroupSettingsProfileType
              }
              isUserAdminUpdateQuery={isUserAdminUpdateQuery}
              isUserOwner={isUserOwner}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default ProfileTopInfo;
