import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Get token from either cookie or Authorization header
    const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];

    console.log('🔐 Auth check:', {
      hasCookie: !!req.cookies.jwt,
      hasAuthHeader: !!req.headers.authorization,
      tokenLength: token?.length,
      path: req.path,
      method: req.method
    });

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not set');
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      console.log('❌ Invalid token - no decoded data');
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    console.log('✅ Token decoded:', {
      userId: decoded.userId,
      hasUserId: !!decoded.userId
    });

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log('❌ User not found for ID:', decoded.userId);
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', {
      name: error.name,
      message: error.message,
      path: req.path,
      method: req.method
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Unauthorized - Token expired" });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};
