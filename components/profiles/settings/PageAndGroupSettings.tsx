// react
import {
  useContext,
  useState,

  // types
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import ProfileSettings from "./ProfileSettings";

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

// types
import { type ProfileAndCoverPictureRefType } from "../ProfileAndCoverPicture";
import type { GroupType, PageType, ReturnTypeOfUseQuery } from "@/lib/types";

export type PageAndGroupSettingsProfileType = {
  setOpenSettings: Dispatch<SetStateAction<boolean>>;
} & (
  | {
      profileType: "page";
      profileInfo: PageType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
    }
  | {
      profileType: "group";
      profileInfo: GroupType;
      updateQuery: ReturnTypeOfUseQuery["updateQuery"];
    }
);

type Props = {
  profilePictureRef: RefObject<ProfileAndCoverPictureRefType>;
  coverPictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profile: PageAndGroupSettingsProfileType;
};

const PageAndGroupSettings = ({
  profilePictureRef,
  coverPictureRef,
  profile,
}: Props) => {
  const [openSettings, setOpenSettings] = useState(false);
  const { user } = useContext(authContext);

  if (profile.profileInfo.owner._id.toString() !== user?._id.toString()) return;

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
          <DialogTitle className="underline underline-offset-[7px] text-primary capitalize">
            {profile.profileType} settings
          </DialogTitle>

          <VisuallyHidden>
            <DialogDescription>
              {profile.profileType} settings list
            </DialogDescription>
          </VisuallyHidden>

          <ProfileSettings
            profilePictureRef={profilePictureRef}
            coverPictureRef={coverPictureRef}
            {...profile}
            setOpenSettings={setOpenSettings}
          />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
export default PageAndGroupSettings;
