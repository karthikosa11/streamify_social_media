import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import bcrypt from 'bcryptjs';
import { getErrorMessage } from "../utils/error.utils.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from 'jsonwebtoken';

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Get current user to check friends array
    const currentUser = await User.findById(myId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // check if users are already friends (check both users' friends arrays)
    if (currentUser.friends.includes(recipientId) || recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a pending req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
      status: "pending" // Only check for pending requests
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    // Check if there's a rejected request and update it to pending
    const rejectedRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
      status: "rejected"
    });

    if (rejectedRequest) {
      // Update the rejected request to pending and update the sender/recipient if needed
      console.log(`Updating rejected friend request ${rejectedRequest._id} to pending for users ${myId} -> ${recipientId}`);
      rejectedRequest.status = "pending";
      rejectedRequest.sender = myId;
      rejectedRequest.recipient = recipientId;
      await rejectedRequest.save();
      
      res.status(201).json(rejectedRequest);
      return;
    }

    // Create new friend request if no existing request found
    console.log(`Creating new friend request from ${myId} to ${recipientId}`);
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    // Check if request is already accepted
    if (friendRequest.status === "accepted") {
      return res.status(400).json({ message: "Friend request has already been accepted" });
    }

    // Check if request was rejected
    if (friendRequest.status === "rejected") {
      return res.status(400).json({ message: "Friend request was rejected and cannot be accepted" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    // Filter out requests with missing sender
    const filteredIncomingReqs = incomingReqs.filter(req => req.sender);

    // Get accepted requests from the last 24 hours where current user is either sender or recipient
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const acceptedReqs = await FriendRequest.find({
      $or: [
        { sender: req.user.id, status: "accepted" },
        { recipient: req.user.id, status: "accepted" }
      ],
      updatedAt: { $gte: twentyFourHoursAgo } // Only get requests updated in the last 24 hours
    }).populate([
      {
        path: "sender",
        select: "fullName profilePic nativeLanguage learningLanguage"
      },
      {
        path: "recipient", 
        select: "fullName profilePic nativeLanguage learningLanguage"
      }
    ]);

    res.status(200).json({ incomingReqs: filteredIncomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    // console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      fullName,
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    console.log('👤 Getting profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.log('❌ User not found for profile');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ Profile retrieved for:', user.email);
    res.json(user);
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    console.log('📝 Profile update request:', {
      body: req.body,
      userId: req.user._id
    });

    const { fullName, email, dateOfBirth, gender, bio, nativeLanguage, learningLanguage, location, profilePic } = req.body;
    const updateData = {};

    // Only update fields that are provided
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (bio) updateData.bio = bio;
    if (nativeLanguage) updateData.nativeLanguage = nativeLanguage;
    if (learningLanguage) updateData.learningLanguage = learningLanguage;
    if (location) updateData.location = location;

    // Handle profile picture - only allow external avatar URLs
    if (profilePic) {
      // Validate that it's an external URL (not a file upload)
      if (profilePic.startsWith('http') && !profilePic.includes('localhost')) {
        updateData.profilePic = profilePic;
      } else {
        return res.status(400).json({ message: "Only external avatar URLs are allowed" });
      }
    }

    console.log('🔄 Updating user with data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      console.log('❌ User not found for update');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Profile updated successfully for:', user.email);
    res.json(user);
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const emergencyNudge = async (req, res) => {
  try {
    const { id: recipientId } = req.params;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    if (!sender) {
      return res.status(404).json({ message: "Sender not found." });
    }

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email configuration missing for emergency nudge:", {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS
      });
      return res.status(500).json({ message: "Email service not configured. Please contact support." });
    }

    const subject = `Urgent: ${sender.fullName} is trying to reach you!`;
    const emailText = `
Hello ${recipient.fullName},

This is an urgent notification from Streamify.

Your friend, ${sender.fullName} is trying to contact you urgently through the app but hasn't received a response.

Please check your messages on Streamify or contact them back as soon as possible.

Thank you,
The Streamify Team
    `;

    try {
      await sendEmail({
        to: recipient.email,
        subject,
        text: emailText,
      });
      
      res.status(200).json({ message: `Emergency nudge sent to ${recipient.fullName}.` });
    } catch (emailError) {
      console.error("Email sending failed for emergency nudge:", emailError);
      return res.status(500).json({ message: "Failed to send emergency nudge. Please try again later." });
    }
  } catch (error) {
    console.error("Error in emergencyNudge controller:", error);
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

export async function rejectFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to reject this request" });
    }

    // Check if request is already processed
    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Friend request has already been processed" });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
