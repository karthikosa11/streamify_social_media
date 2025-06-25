import { Link, useLocation } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import useLogout from "../hooks/useLogout";
import Stories from "./Stories";
import SimpleThemeToggle from "./SimpleThemeToggle";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  const { logoutMutation } = useLogout();

  return (
    <div className="sticky top-0 z-30 bg-base-200 border-b border-base-300">
      

      {/* Stories Section */}
      {!isChatPage && <Stories />}
    </div>
  );
};

export default Navbar;
