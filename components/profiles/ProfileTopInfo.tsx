// react
import type { ReactNode, RefObject } from "react";

// components
import FriendshipBtns from "@/app/(routes)/user/[userId]/components/FriendshipBtns";
import PageAndGroupSettings, {
  type PageAndGroupSettingsProfileType,
} from "./settings/PageAndGroupSettings";

import ProfileAndCoverPicture, {
  type ProfileAndCoverPictureOptionalProps,
  type ProfileAndCoverPictureRefType,
} from "./ProfileAndCoverPicture";

// types
import type {
  GroupType,
  PageType,
  ReturnTypeOfUseQuery,
  UserType,
} from "@/lib/types";

type Props = {
  coverPictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profilePictureRef: RefObject<ProfileAndCoverPictureRefType>;
} & (
  | {
      profileType: "personal";
      profileOwner: UserType;
      pageInfo?: never;
      updateQuery?: never;
    }
  | {
      profileType: "page";
      pageInfo: PageType;
      profileOwner?: never;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
    }
  | {
      profileType: "group";
      profileOwner?: never;
      pageInfo?: never;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
    }
);

const ProfileTopInfo = ({
  coverPictureRef,
  profilePictureRef,
  profileOwner,
  profileType,
  pageInfo,
  updateQuery,
}: Props) => {
  const values: Record<"name" | "secondaryText", ReactNode> = {
    name: "",
    secondaryText: "",
  };

  switch (profileType) {
    case "personal": {
      values.name = profileOwner.username;
      values.secondaryText = profileOwner.email;
      break;
    }

    case "page": {
      values.name = pageInfo.name;
      values.secondaryText = (
        <p className="text-gray-600 text-md truncate">
          <b className="text-primary">{pageInfo.followersCount}</b> followers
        </p>
      );
      break;
    }
  }

  let profileAndCoverPictureProps: ProfileAndCoverPictureOptionalProps;

  switch (profileType) {
    case "personal": {
      profileAndCoverPictureProps = { profileType, profileInfo: profileOwner };
      break;
    }
    case "page": {
      profileAndCoverPictureProps = {
        profileType,
        profileInfo: pageInfo,
        updateQuery,
      };
      break;
    }
    case "group": {
      profileAndCoverPictureProps = {
        profileType,
        profileInfo: {} as GroupType,
        updateQuery,
      };
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

      <div className="mt-3 flex gap-4 justify-between flex-wrap items-center">
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
              <FriendshipBtns userId={profileOwner._id} />
            )}
          </div>
        </div>

        {profileType !== "personal" && (
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
          />
        )}
      </div>
    </div>
  );
};
export default ProfileTopInfo;
