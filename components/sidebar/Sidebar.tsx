"use client";

// nextjs
import Link from "next/link";

// react
import { useContext, useId, useState } from "react";

// contexts
import { authContext } from "@/contexts/AuthContext";
import { userNotificationsCountContext } from "@/contexts/UserNotificationsCountContext";

// components
import NotificationsDialogContent from "../NotificationsDialogContent";
import Loading from "../Loading";
// shadcn
import { Button } from "../ui/button";
import {
  Sidebar as SidebarElement,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Dialog } from "@/components/ui/dialog";

// icons
import {
  FaUser,
  FaUserFriends,
  FaBookmark,
  FaBell,
  FaFlag,
} from "react-icons/fa";
import { MdGroups, MdLogout } from "react-icons/md";
import { TiUserAdd } from "react-icons/ti";
import { FaPeopleGroup } from "react-icons/fa6";

// types
import { type IconType } from "react-icons";

// utils
import { nanoid } from "nanoid";

// hooks
import useLogout from "@/hooks/useLogout";

const sidebarItems: {
  content: string;
  href: string;
  Icon: IconType;
  id: string;
}[] = [
  {
    content: "your profile",
    href: `/user/profile`,
    Icon: FaUser,
  },
  {
    content: "friends",
    href: `/friends`,
    Icon: FaUserFriends,
  },
  {
    content: "saved posts",
    href: `/savedPosts`,
    Icon: FaBookmark,
  },
  {
    content: "pages",
    href: `/pages`,
    Icon: FaFlag,
  },
  {
    content: "groups",
    href: `/groups`,
    Icon: MdGroups,
  },
  {
    content: "people you may know",
    href: `/peopleMayKnow`,
    Icon: FaPeopleGroup,
  },
].map((item) => ({ ...item, id: nanoid() }));

const Sidebar = () => {
  const { logout, loading } = useLogout();

  const [openDialog, setOpenDialog] = useState(false);

  const { user } = useContext(authContext);
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

  const notificationsId = useId();
  const friendshipRequestsId = useId();

  const { isMobile, toggleSidebar } = useSidebar();

  return (
    <>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <NotificationsDialogContent setOpenDialog={setOpenDialog} />
      </Dialog>

      <SidebarElement id="nav-sidebar">
        {isMobile && (
          <SidebarHeader>
            <Button
              title="close sidebar"
              className="red-btn circle-btn text-xl font-bold !h-[38px] w-[38px] ml-auto"
              onClick={toggleSidebar}
            >
              X
            </Button>
          </SidebarHeader>
        )}

        <SidebarContent className="h-full">
          <SidebarGroup className="h-full">
            <SidebarGroupContent className="h-full">
              <SidebarMenu className="h-full">
                <SidebarMenuItem
                  key={notificationsId}
                  className="flex"
                  onClick={toggleSidebar}
                >
                  <Button
                    title="see notifications"
                    className="w-full !py-6 flex justify-between hide_header_icons:hidden"
                    onClick={() => setOpenDialog(true)}
                  >
                    <>
                      <div className="flex gap-2 items-center">
                        <FaBell size={22} />
                        <p>notifications</p>
                      </div>

                      {((!notificationsCountErr && notificationsCount) ||
                        notificationsCountLoading) && (
                        <div className="relative z-[1] shadow-md grid place-content-center bg-white text-primary rounded-full w-[25px] h-[25px] font-bold">
                          {notificationsCountLoading && <Loading size={14} />}
                          {!notificationsCountLoading && (
                            <>
                              {notificationsCount > 9
                                ? "+9"
                                : notificationsCount}
                              <span className="-z-[1] absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                            </>
                          )}
                        </div>
                      )}
                    </>
                  </Button>
                </SidebarMenuItem>

                <SidebarMenuItem key={friendshipRequestsId}>
                  <Button
                    asChild
                    className="w-full !py-6 flex justify-between hide_header_icons:hidden"
                    onClick={toggleSidebar}
                  >
                    <Link
                      title="see friend ship requests"
                      href="/friends/requests"
                    >
                      <div className="flex gap-2 items-center">
                        <TiUserAdd size={22} />
                        <p>friendship requests</p>
                      </div>

                      {((!friendshipRequestsCountErr &&
                        friendshipRequestsCount) ||
                        friendshipRequestsCountLoading) && (
                        <div className="relative z-[1] shadow-md grid place-content-center bg-white text-primary rounded-full w-[25px] h-[25px] font-bold">
                          {friendshipRequestsCountLoading && (
                            <Loading size={14} />
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
                    </Link>
                  </Button>
                </SidebarMenuItem>

                {sidebarItems.map(({ id, Icon, content, href }) => (
                  <SidebarMenuItem key={id}>
                    <Button
                      onClick={toggleSidebar}
                      asChild
                      className="w-full !py-6 flex justify-start"
                    >
                      <Link title={content} href={href}>
                        <Icon size={22} />
                        <p>{content}</p>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                ))}

                {user && (
                  <SidebarMenuItem className="mt-auto">
                    <Button
                      title="logout"
                      className="w-full !py-6 flex justify-start"
                      disabled={loading}
                      onClick={async () => {
                        await logout();
                        toggleSidebar();
                      }}
                    >
                      <MdLogout />
                      <p>Logout</p>
                    </Button>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarElement>
    </>
  );
};

export default Sidebar;
