import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PageHeader = ({ title, showBack = true, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    // Always go to home page
    navigate("/");
  };

  return (
    <div className="lg:hidden bg-base-200 border-b border-base-300 px-4 py-3 flex items-center gap-3">
      {showBack && (
        <button
          onClick={handleGoBack}
          className="p-2 rounded-lg hover:bg-base-300 transition-colors"
          aria-label="Go to home"
        >
          <ArrowLeft className="size-5 text-base-content" />
        </button>
      )}
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-base-content">{title}</h1>
      </div>
      
      {children}
    </div>
  );
};

export default PageHeader; 