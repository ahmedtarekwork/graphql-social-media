"use client";

// react
import { useState } from "react";

// components
import CommunitiesSidebar from "@/components/communities/CommunitiesSidebar";
import DisplayCommunities from "@/components/communities/DisplayCommunities";
// shadcn
import { SidebarProvider } from "@/components/ui/sidebar";

// types
import type { CommunitiesType } from "@/lib/types";

const RenderCommunitiesPage = ({ type }: { type: "group" | "page" }) => {
  const [CommunitiesType, setCommunitiesType] =
    useState<CommunitiesType>("explore");

  return (
    <>
      <SidebarProvider defaultOpen>
        <CommunitiesSidebar
          mode={`${type}s`}
          setCommunitiesType={setCommunitiesType}
        />
      </SidebarProvider>

      <h3 className="text-primary capitalize underline underline-offset-[7px] font-bold mb-2 text-2xl">
        {CommunitiesType} {type}s
      </h3>

      <DisplayCommunities
        mode={type}
        CommunitiesType={CommunitiesType}
        setCommunitiesType={setCommunitiesType}
      />
    </>
  );
};
export default RenderCommunitiesPage;
