// nextjs
import { useParams } from "next/navigation";

// react
import { type RefObject } from "react";

// components
import SettingSlice from "../../../app/(routes)/user/[userId]/components/SettingSlice";
import RemovePictureSlice from "./RemovePictureSlice";

// shadcn
import { Button } from "@/components/ui/button";

// icons
import { MdCameraswitch } from "react-icons/md";

// types
import { type ProfileAndCoverPictureRefType } from "../ProfileAndCoverPicture";
import type { UserType } from "@/lib/types";
import { type PageAndGroupSettingsProfileType } from "./PageAndGroupSettings";

type ProfileSettingsProfileTypeProps =
  | {
      profileType: "personal";
      profileInfo: UserType;
      setOpenSettings?: never;
      updateQuery?: never;
    }
  | PageAndGroupSettingsProfileType;

type Props = {
  coverPictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profilePictureRef: RefObject<ProfileAndCoverPictureRefType>;
} & ProfileSettingsProfileTypeProps;

const ProfileSettings = ({
  coverPictureRef,
  profilePictureRef,
  profileType,
  profileInfo,
  updateQuery,
  setOpenSettings,
}: Props) => {
  const pageId = (useParams()?.pageId || "") as string;

  const settingsSliceProps =
    profileType === "page"
      ? { profileType: "page" as "page", pageId: pageId }
      : { profileType: "group" as "group", groupId: "" };

  return (
    <div className="space-y-2 text-left">
      <div className="pb-4 space-y-2">
        <h3 className="text-secondary font-bold underline ">profile picture</h3>

        <div className="setting-slice">
          <p>{profileInfo.profilePicture ? "change" : "Add"} profile picture</p>

          <input
            type="file"
            className="hidden"
            id="change-profile-picture-from-settings"
            onChange={(e) => {
              const picture = e.target.files?.[0];
              if (picture) {
                profilePictureRef.current?.setNewPicture(picture);
                if (profileInfo.profilePicture)
                  profilePictureRef.current?.setMode("update");

                setOpenSettings?.(false);
              }
            }}
          />

          <Button asChild>
            <label
              htmlFor="change-profile-picture-from-settings"
              className="cursor-pointer"
            >
              {profileInfo.profilePicture ? (
                <>
                  <MdCameraswitch />
                  Change
                </>
              ) : (
                <>
                  {" "}
                  <b>+</b>
                  Add
                </>
              )}
            </label>
          </Button>
        </div>

        <RemovePictureSlice pictureType="profile" />
      </div>

      <div className="pb-4 space-y-2">
        <h3 className="text-secondary font-bold underline">cover picture</h3>

        <div className="setting-slice">
          <p>{profileInfo.coverPicture ? "change" : "Add"} cover picture</p>

          <input
            type="file"
            className="hidden"
            id="change-cover-picture-from-settings"
            onChange={(e) => {
              const picture = e.target.files?.[0];
              if (picture) {
                coverPictureRef.current?.setNewPicture(picture);
                if (profileInfo.coverPicture)
                  coverPictureRef.current?.setMode("update");

                setOpenSettings?.(false);
              }
            }}
          />

          <Button asChild>
            <label
              htmlFor="change-cover-picture-from-settings"
              className="cursor-pointer"
            >
              {profileInfo.coverPicture ? (
                <>
                  <MdCameraswitch />
                  Change
                </>
              ) : (
                <>
                  {" "}
                  <b>+</b>
                  Add
                </>
              )}
            </label>
          </Button>
        </div>

        <RemovePictureSlice pictureType="cover" />
      </div>

      {profileType === "personal" && (
        <>
          <SettingSlice
            profileType={profileType}
            settingName="email"
            settingValue={profileInfo.email}
          />
          <SettingSlice
            profileType={profileType}
            settingName="username"
            settingValue={profileInfo.username}
          />
          <SettingSlice
            profileType={profileType}
            settingName="address"
            settingValue={profileInfo.address}
          />
        </>
      )}

      {profileType !== "personal" && (
        <SettingSlice
          {...settingsSliceProps}
          updateQuery={updateQuery}
          settingName="name"
          settingValue={profileInfo.name}
        />
      )}
    </div>
  );
};
export default ProfileSettings;
