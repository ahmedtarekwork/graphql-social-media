"use client";

// react
import { useContext, useEffect, type ReactNode } from "react";

// nextjs
import { usePathname, useRouter } from "next/navigation";

// context
import { authContext } from "@/contexts/AuthContext";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useContext(authContext);

  useEffect(() => {
    if (["/login", "/signup"].includes(pathname) && user) {
      router.push("/");
    }
  }, [user, pathname, router]);

  return children;
};
export default AuthLayout;
