// components
import RenderCommunitiesPage from "@/components/communities/RenderCommunitiesPage";
import { SidebarProvider } from "@/components/ui/sidebar";

const AllPagesPage = () => {
  return (
    <SidebarProvider defaultOpen>
      <RenderCommunitiesPage type="page" />
    </SidebarProvider>
  );
};
export default AllPagesPage;
