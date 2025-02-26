"use client";

// react
import { useEffect } from "react";

// components
// shadcn
import { Button } from "../ui/button";
import { useSidebar } from "@/components/ui/sidebar";

// icons
import { FaBars } from "react-icons/fa";

const SidebarTrigger = () => {
  const { toggleSidebar, state } = useSidebar();

  useEffect(() => {
    const openState = state === "expanded";

    document.body.classList.toggle("block-scroll", openState);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (e: any) => {
      if (openState) {
        if (e.target.dataset.sidebar !== "content") toggleSidebar();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (openState) {
        if (e.key.toLowerCase() === "escape") toggleSidebar();
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("block-scroll");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Button
      title="toggle nav sidebar"
      className="circle-btn"
      onClick={toggleSidebar}
    >
      <FaBars size={20} />
    </Button>
  );
};
export default SidebarTrigger;
