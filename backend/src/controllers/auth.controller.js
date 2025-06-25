import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

export async function signup(req, res) {
  const { fullName, email, password } = req.body;

  try {
    // Input validation
    if (!email || !fullName || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists. Please use a different email" });
    }

    // Generate random avatar
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    // Create user
    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    // Create Stream user
    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      // console.log(`Stream user created for ${newUser.fullName}`);
    } catch (streamError) {
      // console.error("Error creating Stream user:", streamError);
      // Don't fail signup if Stream user creation fails
    }

    // Verify JWT secret is available
    if (!process.env.JWT_SECRET) {
      // console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax", // Changed from strict to lax for local development
      secure: process.env.NODE_ENV === "production",
    });

    // Send welcome email
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4a90e2;">👋 Welcome to Streamify!</h2>
            <p style="font-size: 16px; color: #333;">Hey <strong>${newUser.fullName}</strong>,</p>
            <p style="font-size: 15px; color: #555;">
              We're thrilled to have you on board! Streamify is your all-in-one hub for sharing moments, chatting with friends, and connecting in real time.
            </p>
            <p style="font-size: 15px; color: #555;">
              Whether you're sharing your day through stories, chatting with friends, or jumping on a quick video call — Streamify brings it all together.
            </p>
            <p style="font-size: 15px; color: #555;">Get started by opening the app and saying hello to your friends 👇</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #4a90e2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Streamify</a>
            </div>
            <p style="font-size: 13px; color: #999;">If you didn't sign up for Streamify, you can safely ignore this email.</p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              © ${new Date().getFullYear()} Streamify. All rights reserved.
            </p>
          </div>
        </div>
      `;
      await sendEmail(email, "Welcome to Streamify", html);
    } catch (emailError) {
      // console.error("Error sending welcome email:", emailError);
      // Don't fail signup if email fails
    }

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    // console.error("Error in auth signup controller:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

    // Verify JWT secret is available
    if (!process.env.JWT_SECRET) {
      // console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax", // Changed from strict to lax for local development
      secure: false, // Set to false for local development
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    // console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      // console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      // console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    // console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function forgotPassword(req,res){
  try {
    const {email}=req.body;
    const user=await User.findOne({email});
    if(!user) return res.status(404).json({message:"User not found"});

    const token=crypto.randomBytes(32).toString('hex');
    const hashedToken=crypto.createHash('sha256').update(token).digest('hex');

    user.resetToken=hashedToken;
    user.resetTokenExpire=Date.now() + 10*60*1000; // 10 minutes

    await user.save();
    // console.log("updated user",user);

    const resetUrl=`${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

    const html = `
    <p>Hi ${user.fullName || 'User'},</p>
    <p>Click the link below to reset your Streamify password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
  `;

  await sendEmail(user.email, 'Streamify Password Reset', html);
    
  res.json({ message: 'Password reset link sent to email' });


  } catch (error) {
    // console.error("Error in forget password controller",error);
    res.status(400).json({message:"Internal server Error"});
  }
}
export async function resetPassword(req,res){
  try {
    const token=crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user=await User.findOne({
      resetToken:token,
      resetTokenExpire:{$gt:Date.now()},

  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  // console.log("the updated pass is",req.body.password);
  user.password = req.body.password; // Let pre-save hook handle hashing
  user.resetToken=undefined;
  user.resetTokenExpire=undefined;

  await user.save();

  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const html = `
    <p>Your password has been updated successfully.</p>
    <p>You can now <a href="${loginUrl}">log in</a>.</p>
  `;

  await sendEmail(user.email, 'Streamify Password Changed', html);

  res.json({ message: 'Password updated successfully' });
  } catch (error) {
    // console.log("Error reset-password controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
  
};
