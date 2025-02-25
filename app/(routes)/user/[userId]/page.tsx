"use client";

// nextjs
import { useParams } from "next/navigation";
import Link from "next/link";

// react
import {
  type MouseEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";

// components
import IllustrationPage from "@/components/IllustrationPage";
import Loading from "@/components/Loading";
import ProfileTopInfo from "@/components/profiles/ProfileTopInfo";

import TabsSwitcher, {
  type TabsSwitcherRefType,
} from "./components/TabsSwitcher";

// shadcn
import { Button } from "@/components/ui/button";

// SVGs
import needLoginSVG from "/public/illustrations/personal-data.svg";
import notFoundSVG from "/public/illustrations/404.svg";

// graphql
import { gql, useLazyQuery } from "@apollo/client";

// hooks
import useIsCurrentUserProfile from "@/hooks/useIsCurrentUserProfile";

// tpyes
import { type ProfileAndCoverPictureRefType } from "../../../../components/profiles/ProfileAndCoverPicture";

const putActiveClassOnTab = (e: MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.parentElement?.parentElement
    ?.querySelectorAll("button")
    .forEach((btn) => {
      btn.classList.add("bg-primary");
      btn.classList.remove("scale-110", "font-bold", "bg-secondary");
    });

  e.currentTarget.classList.add("scale-110", "font-bold", "bg-secondary");
};

// gql
const GET_SINGLE_USER = gql`
  query GetSingleUser($userId: ID!) {
    getSingleUser(userId: $userId) {
      _id
      address
      email
      username

      coverPicture {
        secure_url
        public_id
      }

      profilePicture {
        public_id
        secure_url
      }
    }
  }
`;

const ProfilePage = () => {
  // contexts
  const { user } = useContext(authContext);

  const userId = useParams()?.userId;
  const isCurrentUserProfile = useIsCurrentUserProfile();

  // gql
  const [getUser, { loading: getUserLoading }] = useLazyQuery(GET_SINGLE_USER, {
    onCompleted(data) {
      setProfileOwner(data.getSingleUser);
    },
  });

  // states
  const [profileOwner, setProfileOwner] = useState(
    isCurrentUserProfile ? user : null
  );

  // refs
  const tabsSwitcherRef = useRef<TabsSwitcherRefType>(null);
  const coverPictureRef = useRef<ProfileAndCoverPictureRefType>(null);
  const profilePictureRef = useRef<ProfileAndCoverPictureRefType>(null);

  useEffect(() => {
    if (!isCurrentUserProfile && userId) {
      getUser({
        variables: {
          userId,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCurrentUserProfile) setProfileOwner(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!userId) {
    return (
      <IllustrationPage
        content="User ID is required!"
        svg={needLoginSVG}
        btn={{ type: "go-to-home" }}
      />
    );
  }

  if (getUserLoading) return <Loading />;

  if (!profileOwner) {
    if (isCurrentUserProfile) {
      return (
        <IllustrationPage
          content="You need to login to see your profile"
          svg={needLoginSVG}
          btn={{
            type: "custom",
            component: (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            ),
          }}
        />
      );
    }

    return (
      <IllustrationPage
        content="can't get this profile at the momment"
        svg={notFoundSVG}
        btn={{ type: "go-to-home" }}
      />
    );
  }

  return (
    <div className="-mt-4">
      {/* user pictures and info */}
      <ProfileTopInfo
        profileType="personal"
        coverPictureRef={coverPictureRef}
        profilePictureRef={profilePictureRef}
        profileInfo={profileOwner}
      />

      {/* tabs bar */}
      <ul className="flex gap-2 bg-primary bg-opacity-20 p-3 mt-2 mb-4 rounded-md border-b-2 border-primary max-sm:justify-center max-sm:flex-wrap max-sm:[&>*]:flex-1 [&>*]:[&>*]:w-full">
        <li>
          <Button
            onClick={(e) => {
              putActiveClassOnTab(e);
              tabsSwitcherRef.current?.setActiveTab("posts");
            }}
            className="duration-200 transition scale-110 bg-secondary font-bold"
          >
            Posts
          </Button>
        </li>

        <li>
          <Button
            onClick={(e) => {
              putActiveClassOnTab(e);
              tabsSwitcherRef.current?.setActiveTab("friends");
            }}
            className="duration-200 transition"
          >
            Friends
          </Button>
        </li>

        <li>
          <Button
            onClick={(e) => {
              putActiveClassOnTab(e);
              tabsSwitcherRef.current?.setActiveTab("about");
            }}
            className="duration-200 transition"
          >
            About
          </Button>
        </li>

        {isCurrentUserProfile && (
          <li>
            <Button
              className="duration-200 transition"
              onClick={(e) => {
                putActiveClassOnTab(e);
                tabsSwitcherRef.current?.setActiveTab("settings");
              }}
            >
              Settings
            </Button>
          </li>
        )}
      </ul>

      {/* main page components */}
      <TabsSwitcher
        profileOwner={profileOwner}
        coverPictureRef={coverPictureRef}
        profilePictureRef={profilePictureRef}
        ref={tabsSwitcherRef}
      />
    </div>
  );
};
export default ProfilePage;
