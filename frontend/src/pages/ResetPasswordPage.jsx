import React, { useState } from 'react'
import { axiosInstance } from '../lib/axios';
import { Link, useParams } from 'react-router-dom';
import { ShipWheelIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';

const ResetPasswordPage = () => {
    const {token}=useParams();
    const [password,setPassword]=useState('');
    const [message,setMessage]=useState('');

    const handleSubmit=async(e)=>{
        e.preventDefault();
        
        // Add password validation
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        try {
            const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
            toast.success("Password Reset Successful");
            setPassword("");
            setMessage(res.data.message);
        } catch (error) {
            // console.log("Error in forget password page",error);
            toast.error(error.response?.data?.message || "Failed to reset password");
        }
    }
return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      data-theme="forest"
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        {/* LOGIN FORM SECTION */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          {/* LOGO */}
          <div className="mb-4 flex items-center justify-start gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
              Streamify
            </span>
          </div>

          {/* ERROR MESSAGE DISPLAY */}
          

          <div className="w-full">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Password Reset</h2>
                  <p className="text-sm opacity-70">
                    Reset your password and start yout journey
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">New Password</span>
                    </label>
                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="******"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full">
                        Reset Password
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-sm">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary hover:underline">
                        Login
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* IMAGE SECTION */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img src="/videocall.png" alt="Language connection illustration" className="w-full h-full" />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">Connect with language partners worldwide</h2>
              <p className="opacity-70">
                Practice conversations, make friends, and improve your language skills together
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage
