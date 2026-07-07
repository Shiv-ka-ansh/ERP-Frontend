import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
 const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

 useEffect(() => {
 const handleResize = () => {
 if (window.innerWidth <= 1024) setSidebarOpen(false);
 else setSidebarOpen(true);
 };
 window.addEventListener("resize", handleResize);
 return () => window.removeEventListener("resize", handleResize);
 }, []);

 const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

 return (
 <div className="flex h-screen bg-gray-50 overflow-hidden">
 <Sidebar isOpen={sidebarOpen} />

 <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
 <Topbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

 <main className="flex-1 p-6 overflow-y-auto mt-14">
 <div className="max-w-7xl mx-auto">
 <Outlet />
 </div>
 </main>
 </div>
 </div>
 );
}
