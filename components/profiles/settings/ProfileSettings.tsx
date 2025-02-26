// react
import { type RefObject } from "react";

// components
import SettingSlice from "../../../app/(routes)/user/[userId]/components/SettingSlice";
import RemovePictureSlice from "./RemovePictureSlice";
import DeleteUserAccountBtn from "./dangerZone/DeleteUserAccountBtn";

// shadcn
import { Button } from "@/components/ui/button";

// icons
import { MdCameraswitch } from "react-icons/md";

// types
import { type ProfileAndCoverPictureRefType } from "../ProfileAndCoverPicture";
import type { UserType } from "@/lib/types";
import { type PageAndGroupSettingsProfileType } from "./PageAndGroupSettings";

export type ProfileSettingsProfileTypeProps =
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
  profile: ProfileSettingsProfileTypeProps;
};

const ProfileSettings = ({
  coverPictureRef,
  profilePictureRef,
  profile,
}: Props) => {
  const { profileType, profileInfo, setOpenSettings } = profile;

  return (
    <div className="space-y-2 text-left">
      <div className="space-y-2">
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
              title="select profile picture"
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

        <RemovePictureSlice
          profile={
            Object.fromEntries(
              Object.entries(profile).filter(([key]) =>
                ["profileInfo", "profileType", "updateQuery"].includes(key)
              )
            ) as Omit<ProfileSettingsProfileTypeProps, "setOpenSettings">
          }
          pictureType="profile"
        />
      </div>

      <div className="space-y-2">
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
              title="select cover picture"
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

        <RemovePictureSlice
          profile={
            Object.fromEntries(
              Object.entries(profile).filter(([key]) =>
                ["profileInfo", "profileType", "updateQuery"].includes(key)
              )
            ) as Omit<ProfileSettingsProfileTypeProps, "setOpenSettings">
          }
          pictureType="cover"
        />
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

          <div className="danger-zone">
            <h3 className="danger-zone-title">Danger Zone</h3>

            <div className="red-setting-slice">
              delete your account
              <DeleteUserAccountBtn />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ProfileSettings;
