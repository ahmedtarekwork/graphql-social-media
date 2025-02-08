import {
  useState,
  forwardRef,
  useImperativeHandle,

  // types
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";

// tabs
import SettingsTab from "./tabs/SettingsTab";
import PostsTab from "./tabs/postsTab/PostsTab";
import AboutTab from "./tabs/AboutTab";
import FriendsTab from "./tabs/FriendsTab";

// types
import { type ProfileAndCoverPictureRefType } from "./ProfileAndCoverPicture";
import type { UserType } from "@/lib/types";

type TabsList = "settings" | "friends" | "posts" | "about";

export type TabsSwitcherRefType = {
  activeTab: TabsList;
  setActiveTab: Dispatch<SetStateAction<TabsList>>;
};

type Props = {
  coverPictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profilePictureRef: RefObject<ProfileAndCoverPictureRefType>;
  profileOwner: UserType;
};

const TabsSwitcher = forwardRef<TabsSwitcherRefType, Props>(
  ({ coverPictureRef, profilePictureRef, profileOwner }, ref) => {
    const [activeTab, setActiveTab] = useState<TabsList>("posts");

    useImperativeHandle(
      ref,
      () => ({
        activeTab,
        setActiveTab,
      }),
      [activeTab]
    );

    switch (activeTab) {
      case "settings": {
        return (
          <SettingsTab
            profilePictureRef={profilePictureRef}
            coverPictureRef={coverPictureRef}
            profileOwner={profileOwner}
          />
        );
      }

      case "about": {
        return <AboutTab profileOwner={profileOwner} />;
      }

      case "posts": {
        return <PostsTab profileOwner={profileOwner} />;
      }

      case "friends": {
        return <FriendsTab />;
      }
    }
  }
);

TabsSwitcher.displayName = "TabsSwitcher";

export default TabsSwitcher;
