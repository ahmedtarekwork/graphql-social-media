"use client";

// nextjs
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// react
import { useContext, useState } from "react";

// context
import { authContext } from "@/contexts/AuthContext";
import { userNotificationsCountContext } from "@/contexts/UserNotificationsCountContext";

// components
import SidebarTrigger from "./sidebar/SidebarTrigger";
import NotificationsDialogContent from "./NotificationsDialogContent";
import Loading from "./Loading";
// shadcn
import { Button } from "./ui/button";
import { Dialog } from "@/components/ui/dialog";

// icons
import { FaUser, FaBell, FaBookmark } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { TiUserAdd } from "react-icons/ti";

// utils
import { toast } from "sonner";

const Header = () => {
  const router = useRouter();
  const { user, setUser } = useContext(authContext);
  const {
    friendshipRequests: {
      count: friendshipRequestsCount,
      err: friendshipRequestsCountErr,
      loading: friendshipRequestsCountLoading,
    },
    notifications: {
      count: notificationsCount,
      err: notificationsCountErr,
      loading: notificationsCountLoading,
    },
  } = useContext(userNotificationsCountContext);

  const [openDialog, setOpenDialog] = useState(false);

  console.log(user);

  return (
    <header id="app-header" className="bg-primary bg-opacity-[42%]">
      <div className="container py-2 flex justify-between items-center">
        <div>
          <SidebarTrigger />

          <Link href="/">
            <Image
              priority
              src="/logo.png"
              alt="app logo"
              width={70}
              height={70}
            />
          </Link>
        </div>

        {user && (
          <>
            <div className="max-hide_header_icons:!hidden">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Button
                  className="circle-btn relative"
                  onClick={() => setOpenDialog(true)}
                >
                  <>
                    {((!notificationsCountErr && notificationsCount) ||
                      notificationsCountLoading) && (
                      <div className="absolute top-[-17%] left-[-17%] shadow-md grid place-content-center bg-primary rounded-full w-[25px] h-[25px]">
                        {notificationsCountLoading && (
                          <Loading fill="white" size={14} />
                        )}
                        {!notificationsCountLoading && (
                          <>
                            {notificationsCount > 9 ? "+9" : notificationsCount}
                            <span className="-z-[1] absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                          </>
                        )}
                      </div>
                    )}
                    <FaBell size={23} />
                  </>
                </Button>
                <NotificationsDialogContent setOpenDialog={setOpenDialog} />
              </Dialog>

              <Button asChild className="circle-btn">
                <Link href="/savedPosts">
                  <FaBookmark size={25} />
                </Link>
              </Button>

              <Button asChild className="circle-btn relative">
                <Link href="/friends/requests">
                  {((!friendshipRequestsCountErr && friendshipRequestsCount) ||
                    friendshipRequestsCountLoading) && (
                    <div className="absolute top-[-17%] left-[-17%] shadow-md grid place-content-center bg-primary rounded-full w-[25px] h-[25px]">
                      {friendshipRequestsCountLoading && (
                        <Loading size={14} fill="white" />
                      )}
                      {!friendshipRequestsCountLoading && (
                        <>
                          {friendshipRequestsCount > 9
                            ? "+9"
                            : friendshipRequestsCount}
                          <span className="-z-[1] absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        </>
                      )}
                    </div>
                  )}
                  <TiUserAdd size={25} />
                </Link>
              </Button>
            </div>

            <div className="max-sm:!hidden">
              <Link
                href="/user/profile"
                className="border-2 border-primary rounded-full grid place-content-center w-[50px] h-[50px] p-0.5"
              >
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture.secure_url}
                    alt="profile picture"
                    width={50}
                    height={50}
                    className="rounded-full aspect-[1] object-cover"
                  />
                ) : (
                  <FaUser size={30} className="fill-secondary" />
                )}
              </Link>

              <Button
                className="circle-btn"
                onClick={async (e) => {
                  e.currentTarget.disabled = true;
                  try {
                    await fetch("/api/logout");
                    setUser(null);
                    router.push("/login");

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (err) {
                    toast.error("can't logout at the momment");
                    if (e.currentTarget) e.currentTarget.disabled = false;
                  }
                }}
              >
                <MdLogout size={23} />
              </Button>
            </div>
          </>
        )}

        {!user && (
          <div className="max-sm:!hidden">
            <Button asChild className="btn">
              <Link href="/login">Login</Link>
            </Button>

            <Button asChild className="btn">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
export default Header;
