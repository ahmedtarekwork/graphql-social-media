"use client";

// react
import { useState } from "react";

// components
import PagesSidebar from "./components/PagesSidebar";
import DisplayPages from "./components/DisplayPages";
// shadcn
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export type PagesType = "owned" | "admin" | "followed" | "explore";

const AllPagesPage = () => {
  const [pagesType, setPagesType] = useState<PagesType>("followed");

  return (
    <>
      <SidebarProvider defaultOpen>
        <PagesSidebar setPagesType={setPagesType} />
      </SidebarProvider>

      <DisplayPages pagesType={pagesType} />
    </>
  );
};
export default AllPagesPage;
