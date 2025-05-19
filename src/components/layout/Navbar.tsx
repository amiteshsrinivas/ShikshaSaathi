import { useState, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Menu, MessageSquare, Mic, BookText, History, BarChart, Settings, LogOut, Sun, Moon, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar, SidebarInset, SidebarFooter, SidebarSeparator } from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  children?: ReactNode;
}

const Navbar = ({
  children
}: NavbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navLinks = [{
    to: "/chat",
    icon: <MessageSquare className="w-4 h-4 mr-2" />,
    text: "Chat"
  }, {
    to: "/voice",
    icon: <Mic className="w-4 h-4 mr-2" />,
    text: "Voice"
  }, {
    to: "/quiz",
    icon: <BookText className="w-4 h-4 mr-2" />,
    text: "Quiz"
  }, {
    to: "/saved",
    icon: <Bookmark className="w-4 h-4 mr-2" />,
    text: "Saved Questions"
  }, {
    to: "/progress",
    icon: <BarChart className="w-4 h-4 mr-2" />,
    text: "Progress"
  }, {
    to: "/history",
    icon: <History className="w-4 h-4 mr-2" />,
    text: "History"
  }];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full">
        <Sidebar className="w-[280px]">
          <SidebarHeader>
            <div className="flex items-center px-4 py-3">
              <img src="/lovable-uploads/12463cf0-2ab4-4e5a-a62e-32aa181d7a1f.png" alt="Shiksha Saathi Logo" className="h-10 w-auto mr-3" />
              <span className="text-edu-blue font-bold text-xl">Shiksha Saathi</span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 hover:bg-edu-lightBlue/30"
                >
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
                <SidebarTrigger className="md:hidden" />
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {navLinks.map(link => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={link.to} 
                          className={({ isActive }) => 
                            `flex items-center px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                              isActive 
                                ? "bg-edu-blue text-white" 
                                : "text-foreground hover:bg-edu-lightBlue/30"
                            }`
                          }
                        >
                          {link.icon}
                          {link.text}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="mt-auto">
            <SidebarSeparator />
            <div className="p-2 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-6 pl-8">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Navbar;