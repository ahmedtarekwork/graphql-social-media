// components
import RenderCommunitiesPage from "@/components/communities/RenderCommunitiesPage";
import { SidebarProvider } from "@/components/ui/sidebar";

const AllGroupsPage = () => {
  return (
    <SidebarProvider defaultOpen>
      <RenderCommunitiesPage type="group" />
    </SidebarProvider>
  );
};
export default AllGroupsPage;
