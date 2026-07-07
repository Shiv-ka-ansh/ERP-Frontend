import React, { useState, useRef, useEffect, useMemo } from "react";
import { Menu, Bell, LogOut, User } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import NotificationDropdown from "./NotificationDropdown";

export default function Topbar({ toggleSidebar, sidebarOpen }) {
  const { currentUser, isOnline, unreadNotifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notificationCount = unreadNotifications.length;

  return (
    <header
      className={`fixed top-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-30 transition-all duration-300 ${sidebarOpen ? "left-60" : "left-16"}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-1">
          <span className="font-brand font-bold text-navy text-sm">
            Summit International School
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}
          ></span>
          <span className="text-xs text-gray-500 hidden md:inline">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            className={`p-2 rounded-lg transition-colors relative ${showNotifications ? "bg-navy/10 text-navy" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-4 bg-cta text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className="relative" ref={profileDropdownRef}>
          <div
            className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="size-8 rounded-full bg-teal/20 text-teal flex items-center justify-center text-sm font-bold overflow-hidden">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Avatar"
                  className="size-full object-cover"
                />
              ) : (
                currentUser?.name?.[0] || "U"
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-gray-700">
                {currentUser?.name || "Guest"}
              </span>
              <span className="text-[10px] text-gray-400">
                {currentUser?.role || "User"}
              </span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 py-1 z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50 md:hidden bg-gray-50/50">
                <p className="text-sm font-medium text-navy">
                  {currentUser?.name || "Guest"}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser?.role || "User"}
                </p>
              </div>
              <button
                onClick={() => {
                  window.localStorage.removeItem("erp_token");
                  window.localStorage.removeItem("erp_user");
                  window.location.href = "/login";
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 mt-1"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
