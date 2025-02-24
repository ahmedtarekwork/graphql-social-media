"use client";

// react
import { useState } from "react";

// components
import CommunitiesSidebar from "@/components/communities/CommunitiesSidebar";
import DisplayCommunities from "@/components/communities/DisplayCommunities";
// shadcn
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

// types
import type { CommunitiesType } from "@/lib/types";
import classNames from "classnames";

const RenderCommunitiesPage = ({ type }: { type: "group" | "page" }) => {
  const [CommunitiesType, setCommunitiesType] =
    useState<CommunitiesType>("explore");

  const { isMobile } = useSidebar();

  return (
    <div className={classNames(!isMobile ? "flex gap-2 -my-4 h-full" : "")}>
      <CommunitiesSidebar
        mode={`${type}s`}
        setCommunitiesType={setCommunitiesType}
        CommunitiesType={CommunitiesType}
      />

      <div className={classNames(!isMobile ? "flex-1 my-4" : "")}>
        <h3 className="text-primary capitalize underline underline-offset-[7px] font-bold mb-4 text-2xl">
          {CommunitiesType} {type}s
        </h3>

        <DisplayCommunities
          mode={type}
          CommunitiesType={CommunitiesType}
          setCommunitiesType={setCommunitiesType}
        />
      </div>
    </div>
  );
};
export default RenderCommunitiesPage;
