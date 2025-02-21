// nextjs
import Link from "next/link";

// react
import { type Dispatch, type SetStateAction } from "react";

// components
// shadcn
import { Button } from "@/components/ui/button";
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

// tpyes
import type { CommunitiesType } from "@/lib/types";
import { type IconType } from "react-icons";

// icons
import { FaHandBackFist, FaHeartCircleCheck } from "react-icons/fa6";
import { RiAdminFill } from "react-icons/ri";
import { MdExplore, MdFiberNew } from "react-icons/md";
import { FaBars } from "react-icons/fa";

type Props = {
  setCommunitiesType: Dispatch<SetStateAction<CommunitiesType>>;
  mode: "pages" | "groups";
};

const CommunitiesSidebar = ({ setCommunitiesType, mode }: Props) => {
  const { isMobile, toggleSidebar } = useSidebar();

  const sidebarItems: {
    content: string;
    type: CommunitiesType;
    Icon: IconType;
  }[] = [
    {
      content: `owned ${mode}`,
      type: "owned",
      Icon: FaHandBackFist,
    },
    {
      content: `admin ${mode}`,
      type: "admin",
      Icon: RiAdminFill,
    },
    {
      content: `followed ${mode}`,
      type: "followed",
      Icon: FaHeartCircleCheck,
    },
    {
      content: `explore ${mode}`,
      type: "explore",
      Icon: MdExplore,
    },
  ];

  return (
    <>
      {/* {isMobile && ( */}
      <Button onClick={toggleSidebar} className="mb-3">
        <FaBars />
        other {mode}
      </Button>
      {/* // )} */}

      <SidebarElement id="communities-sidebar">
        {isMobile && (
          <SidebarHeader>
            <Button
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
                {sidebarItems.map(({ Icon, content, type }) => (
                  <SidebarMenuItem key={type}>
                    <Button
                      className="w-full !py-6 flex justify-start"
                      onClick={() => {
                        setCommunitiesType(type);
                        toggleSidebar();
                      }}
                    >
                      <Icon size={22} />
                      {content}
                    </Button>
                  </SidebarMenuItem>
                ))}

                <SidebarMenuItem>
                  <Button asChild>
                    <Link
                      href={`/${mode}/new`}
                      className="w-full !py-6 flex !justify-start"
                      onClick={toggleSidebar}
                    >
                      <MdFiberNew size={22} />
                      create new {mode.replace("s", "")}
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarElement>
    </>
  );
};
export default CommunitiesSidebar;
