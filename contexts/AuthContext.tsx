"use client";

// next
import { usePathname } from "next/navigation";
import Link from "next/link";

// react
import {
  createContext,
  useState,

  // types
  type Dispatch,
  type SetStateAction,
  type ReactNode,
  useEffect,
} from "react";

// components
import Loading from "@/components/Loading";
import IllustrationPage from "@/components/IllustrationPage";
// shadcn
import { Button } from "@/components/ui/button";

// types
import type { UserType } from "@/lib/types";

// apollo
import { gql, useQuery } from "@apollo/client";

// SVGs
import loginSVG from "/public/illustrations/login.svg";

export const authContext = createContext<{
  user: UserType | null;
  setUser: Dispatch<SetStateAction<UserType | null>>;
}>({ user: null, setUser: () => {} });

const CHECK_USER = gql`
  {
    checkUser {
      _id
      username
      email
      address
      profilePicture {
        public_id
        secure_url
      }
      coverPicture {
        public_id
        secure_url
      }

      ownedPages {
        _id
        name
        profilePicture {
          public_id
          secure_url
        }
      }
      adminPages {
        _id
        name
        profilePicture {
          public_id
          secure_url
        }
      }
      followedPages {
        _id
        name
        profilePicture {
          public_id
          secure_url
        }
      }

      ownedGroups {
        _id
        name
        profilePicture {
          public_id
          secure_url
        }
      }
      adminGroups {
        _id
        profilePicture {
          public_id
          secure_url
        }
        name
      }
      joinedGroups {
        _id
        name
        profilePicture {
          public_id
          secure_url
        }
      }
    }
  }
`;

const AuthContext = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  const needAuthRoutes = [
    "/user/profile",
    "/friends",
    "/friends/requests",
    "/peopleMayKnow",
    "/editPost/",
    "/savedPosts",
  ];

  const [user, setUser] = useState<UserType | null>(null);

  const { loading } = useQuery(CHECK_USER, {
    variables: {},
    onCompleted({ checkUser }) {
      if (checkUser) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __typename, ...data } = checkUser;
        setUser(data);
      }
    },
  });

  if (loading) {
    return <Loading />;
  }

  if (
    (needAuthRoutes.some((route) => pathname.startsWith(route)) ||
      pathname === "/") &&
    !user
  ) {
    return (
      <div className="grid place-content-center" style={{ height: "100vh" }}>
        <IllustrationPage
          content="you need to login first"
          svg={loginSVG}
          btn={{
            type: "custom",
            component: (
              <Button
                asChild
                className="mx-auto block text-center"
                style={{ width: "95%" }}
              >
                <Link href="/login">Login</Link>
              </Button>
            ),
          }}
        />
      </div>
    );
  }

  return (
    <authContext.Provider
      value={{
        user,
        setUser,
      }}
    >
      {children}
    </authContext.Provider>
  );
};
export default AuthContext;
