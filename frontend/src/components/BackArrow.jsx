import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackArrow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Don't show back arrow on home page
  if (location.pathname === "/") {
    return null;
  }

  const handleGoBack = () => {
    // If there's history, go back, otherwise go to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleGoBack}
      className="lg:hidden fixed top-4 left-4 z-40 bg-base-100/80 backdrop-blur-sm rounded-full p-2 shadow-lg border border-base-300 hover:bg-base-200 transition-all duration-200"
      aria-label="Go back"
    >
      <ArrowLeft className="size-5 text-base-content" />
    </button>
  );
};

export default BackArrow; 