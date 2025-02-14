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
import { type PagesType } from "../page";
import { type IconType } from "react-icons";

// icons
import { FaHandBackFist, FaHeartCircleCheck } from "react-icons/fa6";
import { RiAdminFill } from "react-icons/ri";
import { MdExplore } from "react-icons/md";
import { FaBars } from "react-icons/fa";

type Props = {
  setPagesType: Dispatch<SetStateAction<PagesType>>;
};

const PagesSidebar = ({ setPagesType }: Props) => {
  const sidebarItems: {
    content: string;
    type: PagesType;
    Icon: IconType;
  }[] = [
    {
      content: "owned pages",
      type: "owned",
      Icon: FaHandBackFist,
    },
    {
      content: "admin pages",
      type: "admin",
      Icon: RiAdminFill,
    },
    {
      content: "followed pages",
      type: "followed",
      Icon: FaHeartCircleCheck,
    },
    {
      content: "explore pages",
      type: "explore",
      Icon: MdExplore,
    },
  ];

  const { isMobile, toggleSidebar } = useSidebar();

  return (
    <>
      {isMobile && (
        <Button onClick={toggleSidebar} className="mb-3">
          <FaBars />
          other pages
        </Button>
      )}

      <SidebarElement id="pages-sidebar">
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
                      onClick={() => setPagesType(type)}
                    >
                      <Icon size={22} />
                      {content}
                    </Button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarElement>
    </>
  );
};
export default PagesSidebar;
