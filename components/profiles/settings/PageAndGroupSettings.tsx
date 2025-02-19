// nextjs
import { useParams } from "next/navigation";

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
import DisclaimerFromPageBtn from "./dangerZone/DisclaimerFromPageBtn";
import DeletePageBtn from "./dangerZone/DeletePageBtn";

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
      updateQuery: ReturnTypeOfUseQuery["updateQuery"]; // page info
    }
  | {
      profileType: "group";
      profileInfo: GroupType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"]; // group info
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
  const pageId = (useParams()?.pageId || "") as string;

  const { user } = useContext(authContext);
  const [openSettings, setOpenSettings] = useState(false);

  const settingsSliceProps =
    profile.profileType === "page"
      ? { profileType: "page" as const, pageId }
      : { profileType: "group" as const, groupId: "" };

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
            {profile.profileType} settings
          </DialogTitle>

          <VisuallyHidden>
            <DialogDescription>
              {profile.profileType} settings list
            </DialogDescription>
          </VisuallyHidden>

          <div className="space-y-2">
            <h3 className="text-secondary text-left font-bold underline ">
              {profile.profileType} admins
            </h3>

            <div className="setting-slice">
              add new admin
              <AddNewAdminBtn />
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
                  profileType={profile.profileType}
                  isUserOwner={isUserOwner}
                />
              </Dialog>
            </div>
          </div>

          <ProfileSettings
            profilePictureRef={profilePictureRef}
            coverPictureRef={coverPictureRef}
            profile={profile}
          />

          <SettingSlice
            {...settingsSliceProps}
            updateQuery={profile.updateQuery}
            settingName="name"
            settingValue={profile.profileInfo.name}
          />

          <div className="danger-zone">
            <h3 className="danger-zone-title">Danger Zone</h3>

            {user?._id === profile.profileInfo.owner._id ? (
              <div className="red-setting-slice">
                delete {profile.profileType}
                <DeletePageBtn />
              </div>
            ) : (
              <div className="red-setting-slice">
                disclaimer from {profile.profileType}
                <DisclaimerFromPageBtn
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
