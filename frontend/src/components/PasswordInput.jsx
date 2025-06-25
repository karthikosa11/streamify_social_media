import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "••••••••", 
  className = "", 
  error = false,
  required = false 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={`input input-bordered w-full pr-12 ${error ? 'input-error' : ''} ${className}`}
        value={value}
        onChange={onChange}
        required={required}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
        onClick={togglePasswordVisibility}
        tabIndex={-1} // Prevent tab navigation to this button
      >
        {showPassword ? (
          <EyeOff size={20} />
        ) : (
          <Eye size={20} />
        )}
      </button>
    </div>
  );
};

export default PasswordInput; 