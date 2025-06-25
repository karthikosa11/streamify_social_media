import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon, BotIcon, HomeIcon, ShipWheelIcon, UsersIcon, MicIcon, LogOutIcon, SunIcon, MoonIcon, SirenIcon
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmergencyNudge from "./EmergencyNudge";
import SimpleThemeToggle from "./SimpleThemeToggle";
import useLogout from "../hooks/useLogout";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

// Bottom Navigation Component for mobile/tablet
const BottomNavigation = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { logoutMutation } = useLogout();
  const { theme, toggleTheme } = useThemeStore();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);
  const createMenuRef = useRef();
  const emergencyMenuRef = useRef();

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const incomingRequests = friendRequests?.incomingReqs || [];

  // Check if current theme is dark
  const currentTheme = THEMES.find((t) => t.name === theme);
  const isDark = currentTheme ? currentTheme.isDark : false;

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target)) {
        setShowCreateMenu(false);
      }
      if (emergencyMenuRef.current && !emergencyMenuRef.current.contains(event.target)) {
        setShowEmergencyMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 z-50">
      <div className="flex items-center justify-around py-2">
        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 ${
            currentPath === "/" 
              ? "border-primary text-primary shadow-md" 
              : "border-transparent text-base-content/70 hover:border-primary hover:text-primary"
          }`}
          title="Home"
        >
          <HomeIcon className="size-5" />
        </Link>

        {/* Friends */}
        <Link
          to="/friends"
          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 ${
            currentPath === "/friends" 
              ? "border-primary text-primary shadow-md" 
              : "border-transparent text-base-content/70 hover:border-primary hover:text-primary"
          }`}
          title="Friends"
        >
          <UsersIcon className="size-5" />
        </Link>

        {/* Notifications */}
        <Link
          to="/notifications"
          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 relative ${
            currentPath === "/notifications" 
              ? "border-primary text-primary shadow-md" 
              : "border-transparent text-base-content/70 hover:border-primary hover:text-primary"
          }`}
          title="Notifications"
        >
          <BellIcon className="size-5" />
          {incomingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 badge badge-primary badge-xs">
              {incomingRequests.length}
            </span>
          )}
        </Link>

        {/* Create Button */}
        <div className="relative" ref={createMenuRef}>
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 border-transparent text-base-content/70 hover:border-primary hover:text-primary"
            title="Create"
          >
            <span className="text-2xl">➕</span>
          </button>
          {showCreateMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-32 bg-base-100 rounded-lg shadow-lg z-10 border border-base-300">
              <button
                className="flex items-center justify-between w-full px-3 py-2 hover:bg-base-200 text-sm transition-colors"
                onClick={() => {
                  navigate("/ai");
                  setShowCreateMenu(false);
                }}
                title="Create AI Content"
              >
                AI
                <span className="ml-2">✨</span>
              </button>
              <button
                className="flex items-center justify-between w-full px-3 py-2 hover:bg-base-200 text-sm transition-colors"
                onClick={() => {
                  navigate("/create-post");
                  setShowCreateMenu(false);
                }}
                title="Create Post"
              >
                Post
                <span className="ml-2">🖼️</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Assistant */}
        <Link
          to="/ai-assistant"
          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 ${
            currentPath === "/ai-assistant" 
              ? "border-primary text-primary shadow-md" 
              : "border-transparent text-base-content/70 hover:border-primary hover:text-primary"
          }`}
          title="AI Assistant"
        >
          <BotIcon className="size-5" />
        </Link>

        {/* Voice Agent */}
        <Link
          to="/voice-agent"
          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 ${
            currentPath === "/voice-agent" 
              ? "border-primary text-primary shadow-md" 
              : "border-transparent text-base-content/70 hover:border-primary hover:text-primary"
          }`}
          title="Voice Agent"
        >
          <MicIcon className="size-5" />
        </Link>

        {/* Emergency Nudge Button */}
        <div className="relative" ref={emergencyMenuRef}>
          <button
            onClick={() => setShowEmergencyMenu(!showEmergencyMenu)}
            className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 border-transparent text-base-content/70 hover:border-error hover:text-error"
            title="Emergency Nudge"
          >
            <SirenIcon className="size-5" />
          </button>
          {showEmergencyMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-48 bg-base-100 rounded-lg shadow-lg z-10 border border-base-300">
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-2 text-error">Emergency Nudge</h3>
                <p className="text-xs text-base-content/70 mb-3">
                  Send an urgent notification to a friend
                </p>
                <button
                  className="btn btn-error btn-sm w-full"
                  onClick={() => {
                    navigate("/friends");
                    setShowEmergencyMenu(false);
                  }}
                >
                  Send Nudge
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle - Icon Only */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 border-transparent text-base-content/70 hover:border-primary hover:text-primary"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <SunIcon className="size-5 text-yellow-400" />
          ) : (
            <MoonIcon className="size-5 text-slate-600" />
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logoutMutation}
          className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 border-2 border-transparent text-base-content/70 hover:border-error hover:text-error"
          title="Logout"
        >
          <LogOutIcon className="size-5" />
        </button>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();
  const { logoutMutation } = useLogout();

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const incomingRequests = friendRequests?.incomingReqs || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className='w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0'>
        {/* Fixed Header */}
        <div className='p-5 border-b border-base-300 flex-shrink-0'>
          <Link to='/' className='flex items-center gap-2.5'>
            <ShipWheelIcon className='size-9 text-primary' />
            <span className='text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider'>
              Streamify
            </span>
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
          <Link
            to='/'
            className={`btn btn-outline justify-start w-full gap-3 px-3 normal-case transition-all duration-200 ${
              currentPath === "/" 
                ? "btn-primary border-2 shadow-md" 
                : "border-base-300 hover:border-primary hover:shadow-sm"
            }`}
            title="Home - View your feed"
          >
            <HomeIcon className='size-5' />
            <span>Home</span>
          </Link>

          <Link
            to='/friends'
            className={`btn btn-outline justify-start w-full gap-3 px-3 normal-case transition-all duration-200 ${
              currentPath === "/friends" 
                ? "btn-primary border-2 shadow-md" 
                : "border-base-300 hover:border-primary hover:shadow-sm"
            }`}
            title="Friends - Manage your connections"
          >
            <UsersIcon className='size-5' />
            <span>Friends</span>
          </Link>

          <Link
            to='/notifications'
            className={`btn btn-outline justify-start w-full gap-3 px-3 normal-case transition-all duration-200 ${
              currentPath === "/notifications" 
                ? "btn-primary border-2 shadow-md" 
                : "border-base-300 hover:border-primary hover:shadow-sm"
            }`}
            title="Notifications - View your alerts"
          >
            <BellIcon className='size-5' />
            <span>Notifications</span>
            {incomingRequests.length > 0 && (
              <span className='badge badge-primary'>{incomingRequests.length}</span>
            )}
          </Link>

          {/* --- Emergency Nudge Button --- */}
          <EmergencyNudge />

          {/* --- AI Assistant Button --- */}
          <div className='my-4'>
            <Link
              to='/ai-assistant'
              className={`btn btn-outline justify-start w-full gap-3 px-3 normal-case transition-all duration-200 ${
                currentPath === "/ai-assistant" 
                  ? "btn-primary border-2 shadow-md" 
                  : "border-base-300 hover:border-primary hover:shadow-sm"
              }`}
              style={{ fontWeight: 600 }}
              title="AI Assistant - Chat with AI"
            >
              <BotIcon className='size-5' />
              <span>AI Assistant</span>
            </Link>
          </div>

          {/* --- Voice Agent Button --- */}
          <div className='my-4'>
            <Link
              to='/voice-agent'
              className={`btn btn-outline justify-start w-full gap-3 px-3 normal-case transition-all duration-200 ${
                currentPath === "/voice-agent" 
                  ? "btn-primary border-2 shadow-md" 
                  : "border-base-300 hover:border-primary hover:shadow-sm"
              }`}
              style={{ fontWeight: 600 }}
              title="Voice Agent - Voice conversations"
            >
              <MicIcon className='size-5' />
              <span>Voice Agent</span>
            </Link>
          </div>

          <div className='relative' ref={ref}>
            <button
              className='btn btn-outline justify-start w-full gap-3 px-3 normal-case transition-all duration-200 border-base-300 hover:border-primary hover:shadow-sm'
              onClick={() => setOpen((prev) => !prev)}
              title="Create - Make new content"
            >
              <span className='text-2xl'>➕</span>
              <span>Create</span>
            </button>
            {open && (
              <div className='absolute left-0 mt-2 w-48 bg-base-100 rounded-lg shadow-lg z-10 border border-base-300'>
                <button
                  className='flex items-center justify-between w-full px-4 py-2 hover:bg-base-200 transition-colors'
                  onClick={() => {
                    navigate("/ai");
                    setOpen(false);
                  }}
                  title="Create AI-generated content"
                >
                  AI
                  <span className='ml-2'>✨</span>
                </button>
                <button
                  className='flex items-center justify-between w-full px-4 py-2 hover:bg-base-200 transition-colors'
                  onClick={() => {
                    navigate("/create-post");
                    setOpen(false);
                  }}
                  title="Create a new post"
                >
                  Post
                  <span className='ml-2'>🖼️</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle and Logout Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <SimpleThemeToggle />
            <button 
              className="btn btn-outline btn-sm flex-1 border-base-300 hover:border-error hover:text-error transition-all duration-200" 
              onClick={logoutMutation}
              title="Logout - Sign out of your account"
            >
              <LogOutIcon className="size-4" />
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </nav>

        {/* Fixed User Profile Section */}
        <div className='p-4 border-t border-base-300 flex-shrink-0'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='avatar'>
              <div className='w-10 rounded-full'>
                <img src={authUser?.profilePic} alt='User Avatar' />
              </div>
            </div>
            <div className='flex-1'>
              <p className='font-semibold text-sm'>{authUser?.fullName}</p>
              <p className='text-xs text-success flex items-center gap-1'>
                <span className='size-2 rounded-full bg-success inline-block' />
                Online
              </p>
            </div>
          </div>
          
          
        </div>
      </aside>

      {/* Mobile/Tablet Bottom Navigation */}
      <BottomNavigation />
    </>
  );
};
export default Sidebar;
