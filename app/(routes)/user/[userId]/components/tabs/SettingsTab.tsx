// react
import { type RefObject } from "react";

// components
import SettingSlice from "../SettingSlice";
import RemovePictureSettingTabSlice from "../RemovePictureSettingTabSlice";

// shadcn
import { Button } from "@/components/ui/button";

// icons
import { MdCameraswitch } from "react-icons/md";

// types
import { type ProfileAndCoverPictureRefType } from "../ProfileAndCoverPicture";
import type { UserType } from "@/lib/types";

type Props = {
  coverPictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profilePictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profileOwner: UserType;
};

const SettingsTab = ({
  coverPictureRef,
  profilePictureRef,
  profileOwner,
}: Props) => {
  return (
    <div className="space-y-2">
      <div className="pb-4 space-y-2">
        <h3 className="text-secondary font-bold underline">profile picture</h3>

        <div className="setting-slice">
          <p>
            {profileOwner.profilePicture ? "change" : "Add"} profile picture
          </p>

          <input
            type="file"
            className="hidden"
            id="change-profile-picture-from-settings"
            onChange={(e) => {
              const picture = e.target.files?.[0];
              if (picture) {
                profilePictureRef.current?.setNewPicture(picture);
                if (profileOwner.profilePicture)
                  profilePictureRef.current?.setMode("update");
              }
            }}
          />

          <Button asChild>
            <label
              htmlFor="change-profile-picture-from-settings"
              className="cursor-pointer"
            >
              {profileOwner.profilePicture ? (
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

        <RemovePictureSettingTabSlice pictureType="profile" />
      </div>

      <div className="pb-4 space-y-2">
        <h3 className="text-secondary font-bold underline">cover picture</h3>

        <div className="setting-slice">
          <p>{profileOwner.coverPicture ? "change" : "Add"} cover picture</p>

          <input
            type="file"
            className="hidden"
            id="change-cover-picture-from-settings"
            onChange={(e) => {
              const picture = e.target.files?.[0];
              if (picture) {
                coverPictureRef.current?.setNewPicture(picture);
                if (profileOwner.coverPicture)
                  coverPictureRef.current?.setMode("update");
              }
            }}
          />

          <Button asChild>
            <label
              htmlFor="change-cover-picture-from-settings"
              className="cursor-pointer"
            >
              {profileOwner.coverPicture ? (
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

        <RemovePictureSettingTabSlice pictureType="cover" />
      </div>

      <SettingSlice settingName="email" settingValue={profileOwner.email} />
      <SettingSlice
        settingName="username"
        settingValue={profileOwner.username}
      />
      <SettingSlice settingName="address" settingValue={profileOwner.address} />
    </div>
  );
};
export default SettingsTab;
