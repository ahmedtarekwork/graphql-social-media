// react
import {
  useState,
  useContext,

  // types
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";

// context
import { authContext } from "@/contexts/AuthContext";

// components
import ProfileSettings from "./ProfileSettings";
import AdminsList from "./admins/AdminsList";
import AddNewAdminBtn from "./admins/AddNewAdminBtn";
import SettingSlice from "@/app/(routes)/user/[userId]/components/SettingSlice";
import DisclaimerFromCommunityBtn from "./dangerZone/DisclaimerFromCommunityBtn";
import DeleteCommunityBtn from "./dangerZone/DeleteCommunityBtn";

// shadcn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "../../ui/button";

// icons
import { IoSettings } from "react-icons/io5";
import { FaEye } from "react-icons/fa";

// types
import { type ProfileAndCoverPictureRefType } from "../ProfileAndCoverPicture";
import type { GroupType, PageType, ReturnTypeOfUseQuery } from "@/lib/types";

export type PageAndGroupSettingsProfileType = {
  setOpenSettings: Dispatch<SetStateAction<boolean>>;
} & (
  | {
      profileType: "page";
      profileInfo: PageType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"]; // update page info
    }
  | {
      profileType: "group";
      profileInfo: GroupType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"]; // update group info
    }
);

type Props = {
  profilePictureRef: RefObject<ProfileAndCoverPictureRefType>;
  coverPictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profile: PageAndGroupSettingsProfileType;
} & {
  isUserOwner: boolean;
  isUserAdminUpdateQuery: ReturnTypeOfUseQuery["updateQuery"];
};

const PageAndGroupSettings = ({
  profilePictureRef,
  coverPictureRef,
  profile,
  isUserAdminUpdateQuery,
  isUserOwner,
}: Props) => {
  const { profileType, profileInfo, updateQuery } = profile;

  const { user } = useContext(authContext);
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <Dialog open={openSettings} onOpenChange={setOpenSettings}>
      <Button asChild>
        <DialogTrigger>
          <IoSettings />
          Settings
        </DialogTrigger>
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-4 text-center underline underline-offset-[7px] text-primary capitalize">
            {profileType} settings
          </DialogTitle>

          <VisuallyHidden>
            <DialogDescription>{profileType} settings list</DialogDescription>
          </VisuallyHidden>

          <div className="space-y-2">
            <h3 className="text-secondary text-left font-bold underline ">
              {profileType} admins
            </h3>

            <div className="setting-slice">
              add new admin
              <AddNewAdminBtn type={profileType} />
            </div>

            <div className="setting-slice">
              admins list
              <Dialog>
                <Button asChild>
                  <DialogTrigger>
                    <FaEye />
                    Show
                  </DialogTrigger>
                </Button>

                <AdminsList
                  profileType={profileType}
                  isUserOwner={isUserOwner}
                />
              </Dialog>
            </div>
          </div>

          <ProfileSettings
            profilePictureRef={profilePictureRef}
            coverPictureRef={coverPictureRef}
            profile={{ ...profile, setOpenSettings }}
          />

          <SettingSlice
            profileType={profileType}
            updateQuery={updateQuery}
            settingName="name"
            settingValue={profileInfo.name}
          />

          <div className="danger-zone">
            <h3 className="danger-zone-title">Danger Zone</h3>

            {user?._id === profileInfo.owner._id ? (
              <div className="red-setting-slice">
                delete {profileType}
                <DeleteCommunityBtn />
              </div>
            ) : (
              <div className="red-setting-slice">
                disclaimer from {profileType}
                <DisclaimerFromCommunityBtn
                  profileType={profileType}
                  isUserAdminUpdateQuery={isUserAdminUpdateQuery}
                />
              </div>
            )}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
export default PageAndGroupSettings;
