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
        _id
      }
      coverPicture {
        public_id
        secure_url
        _id
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
    "/savedPosts",
    "/groups/new",
    "/groups",
    "/pages",
    "/pages/new",
  ];

  const [user, setUser] = useState<UserType | null>(null);
  const [skipRefetch, setSkipRefetch] = useState(false);

  const { loading } = useQuery(CHECK_USER, {
    skip: skipRefetch && !user,
    variables: {},
    onCompleted({ checkUser }) {
      if (checkUser && !skipRefetch) {
        setUser(checkUser);
        setSkipRefetch(true);
      }
    },
  });

  if (loading) return <Loading />;

  if (
    (needAuthRoutes.includes(pathname) ||
      pathname === "/" ||
      pathname.startsWith("/editPost/")) &&
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
                title="go to login page"
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
