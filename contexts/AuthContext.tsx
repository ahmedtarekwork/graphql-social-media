"use client";

// next
import { usePathname, useRouter } from "next/navigation";

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

// types
import type { UserType } from "@/lib/types";

// apollo
import { gql, useQuery } from "@apollo/client";

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
  const router = useRouter();

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

  useEffect(() => {
    if (!loading) {
      if (["/login", "/signup"].includes(pathname) && user) {
        router.push("/");
      }

      if (
        (needAuthRoutes.includes(pathname) ||
          pathname === "/" ||
          pathname.startsWith("/editPost/")) &&
        !user
      ) {
        router.push("/login");
      }
    }
  });

  if (loading) return <Loading />;

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
