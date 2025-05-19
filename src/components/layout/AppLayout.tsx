
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "./Navbar";
import { SidebarInset } from "@/components/ui/sidebar";

const AppLayout = () => {
  return (
    <Navbar>
      <SidebarInset>
        <main className="container max-w-6xl px-4 py-4">
          <Outlet />
        </main>
        <Toaster position="top-right" />
      </SidebarInset>
    </Navbar>
  );
};

export default AppLayout;
