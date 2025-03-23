import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

// Generating token
const generateToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken }; 
};


// Storing Refreshed Token
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60 // 7 days expiry
    );
    console.log(`✅ Refresh token stored for user: ${userId}`);
  } catch (error) {
    console.error(`❌ Redis error while storing token for user ${userId}:`, error);
  }
};

// setting cookies
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // prevent XSS attacks,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevent CSRF attack, cross-site request forgery,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevent XSS attacks,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevent CSRF attack, cross-site request forgery,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};


// sign up route
export const signup = async (req, res) => {
  // using async to make it asynchronous
  const { email, password, name } = req.body; // email, password parsed from the body
  try {
    const userExists = await User.findOne({ email }); // finding if the user exists

    // if-else what should be done if the user exists or not
    if (userExists) {
      return res.status(400).json({ message: "User already exists" }); // if the user exists it will send the error
    }
    const user = await User.create({ name, email, password }); // if the user doesn't exists it will create the user.. using await bcz it gonna wait until the user get created

    // We are gonna authenticate the user
    const { accessToken, refreshToken } = generateToken(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User created successfully",
    }); // return the message that the user is created and also the details of the user....
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// login route
export const login = async (req, res) => {
  try {
    const{email, password} = req.body;
    const user = await User.findOne({email});

    if (user && (await user.comparePassword(password))) {
      const {accessToken, refreshToken} = generateToken(user._id);

      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    };

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({message: error.message});
  }
};


// logout route
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken){
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`)
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({message: "Logged Out Successfully"});
  } catch (error) {
    res.status(500).json({message: 'server error', error: error.message});
  }

};



// refresh the access token

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) {
      return res.status(401).json({message: "No refresh Token provided"});
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

  if (storedToken !== refreshToken){
    return res.status(401).json({message: "Invalid refresh token"})
  }

  const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"});

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.json({message: "Token refreshed successfully"});
  } catch (error) {
    res.status(500).json({message: "Server error", error:error.message});
  }
};

export const getProfile = async (req, res) =>{
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({message: "Server error", error: error.message});
  }
};