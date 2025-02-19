"use client";

// react
import { useState } from "react";

// components
import PagesSidebar from "./components/PagesSidebar";
import DisplayPages from "./components/DisplayPages";
// shadcn
import { SidebarProvider } from "@/components/ui/sidebar";

export type PagesType = "owned" | "admin" | "followed" | "explore";

const AllPagesPage = () => {
  const [pagesType, setPagesType] = useState<PagesType>("explore");

  return (
    <>
      <SidebarProvider defaultOpen>
        <PagesSidebar setPagesType={setPagesType} />
      </SidebarProvider>

      <h3 className="text-primary capitalize underline underline-offset-[7px] font-bold mb-2 text-2xl">
        {pagesType} pages
      </h3>

      <DisplayPages pagesType={pagesType} setPagesType={setPagesType} />
    </>
  );
};
export default AllPagesPage;
