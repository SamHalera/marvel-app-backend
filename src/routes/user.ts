const cloudinary = require("cloudinary").v2;

import express, { Request, Response } from "express";

import { User } from "../models/User";
import uid2 from "uid2";
import SHA256 from "crypto-js/sha256";
import encBase64 from "crypto-js/enc-base64";
import fileUpload from "express-fileupload";
import { RequestExtended } from "../types/types";
import { isAuthenticated } from "../middelware/isAuthenticated";

import { convertToBase64 } from "../utils/convertToBase64";

import mongoose from "mongoose";
import { brevoSendEmail } from "../libs/brevoApi";
import { Favorite } from "../models/Favorites";

export const router = express.Router();

router.post("/user/forgotten-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: 401, message: "Unauthotized!" });
    }

    if (!process.env.FRONT_URL) {
      return res
        .status(401)
        .json({ error: 401, message: "FRONT URL IS MISSING!" });
    }

    const emailTemplateId = 1;
    const paramsForBrevo = {
      url: process.env.FRONT_URL,
      token: user.token,
    };
    const to = [
      {
        email,
      },
    ];

    await brevoSendEmail(paramsForBrevo, to, emailTemplateId);

    return res.status(201).json({ success: "Email has been sent" });
  } catch (error) {
    res.status(500).json({ error: 500, message: error });
  }
});

router.post("/user/reset-password", async (req: Request, res: Response) => {
  try {
    const { password, token } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ error: 400, message: "This fiel is required!" });
    }
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(401).json({ error: 400, message: "UnAthourized" });
    }
    const salt = uid2(16);

    const hash = SHA256(password + salt).toString(encBase64);

    user.salt = salt;
    user.hash = hash;
    await user.save();
    res.status(200).json({ success: "Reset successfully!" });
  } catch (error) {
    res.status(500).json({ error: 500, message: error });
  }
});

router.post("/user/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ error: 400, message: "All fields are required!" });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser && existingUser.username === "Visitor") {
      await User.deleteOne({ _id: existingUser._id });
    }

    if (existingUser !== null) {
      return res
        .status(409)
        .json({ error: 409, message: "This email already exists!" });
    }

    const salt = uid2(16);

    const hash = SHA256(password + salt).toString(encBase64);

    const token = uid2(64);

    const newUser = new User({
      email,
      username,
      token,
      hash,
      salt,
    });

    await newUser.save();

    res.status(201).json({
      token: newUser.token,
    });
  } catch (error: any) {
    res.status(500).json({ error: 500, message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 400, message: "All fields are required!" });
    }

    const user = await User.findOne({ email: email });

    if (user === null) {
      return res.status(401).json({ error: 401, message: "Unauthorized!" });
    }

    const newHash = SHA256(password + user.salt).toString(encBase64);
    if (newHash !== user.hash) {
      return res.status(401).json({ error: 401, message: "Unauthorized!" });
    }

    res.status(200).json({
      token: user.token,
    });
  } catch (error: any) {
    res.status(500).json({ error: 500, message: error.message });
  }
});

router.get(
  "/user/profile",
  isAuthenticated,
  async (req: RequestExtended, res: Response) => {
    try {
      const user = await User.findById({ _id: req.user._id }).select(
        "username email avatar -_id"
      );

      return res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: 500, message: error.message });
    }
  }
);

router.get(
  "/user/avatar",
  isAuthenticated,
  async (req: RequestExtended, res: Response) => {
    try {
      const user = await User.findById({ _id: req.user._id }).select(
        "avatar -_id"
      );

      return res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: 500, message: error.message });
    }
  }
);

router.post(
  "/user/profile",
  isAuthenticated,
  fileUpload(),
  async (req: RequestExtended, res: Response) => {
    const { username, password, newPassword, picture } = req.body;

    try {
      const user = await User.findById({ _id: req.user._id });

      if (user === null) {
        return res.status(401).json({ error: 401, message: "Unauthorized!" });
      }

      if (username) {
        user.username = username;
      }
      if (!password && newPassword) {
        return res.status(400).json({
          error: 400,
          message: "It seems you forget to enter your current password",
        });
      } else {
        if (password && newPassword) {
          const newHash = SHA256(password + user.salt).toString(encBase64);
          if (newHash !== user.hash) {
            return res
              .status(400)
              .json({ error: 400, message: "Invalid credentials" });
          } else {
            const salt = uid2(16);
            const hash = SHA256(newPassword + salt).toString(encBase64);
            user.salt = salt;
            user.hash = hash;
          }
        }
      }

      if (req.files) {
        let userFolderPath;
        let previousPublicId;

        if (!user.avatar) {
          const userFolder = await cloudinary.api.create_folder(
            `/marvel/users/${user._id}`
          );
          userFolderPath = userFolder.path;
        } else {
          const userFolder = `/marvel/users/${user._id}`;
          userFolderPath = userFolder;
          //if user has already a picture we keep its public_id in order to delete it after uploading the new one
          previousPublicId = user.avatar.public_id;
        }

        const pictureToUpload = req.files.picture;
        const transformedPicture = convertToBase64(pictureToUpload);

        const pictureToSave = await cloudinary.uploader.upload(
          transformedPicture,
          { folder: userFolderPath }
        );

        user.avatar = pictureToSave;

        if (previousPublicId) {
          await cloudinary.uploader.destroy(previousPublicId, {
            folder: userFolderPath,
          });
        }
      }

      await user.save();

      return res.status(200).json({
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      });
    } catch (error: any) {
      res.status(500).json({ error: 500, message: error.message });
    }
  }
);

router.delete(
  "/user/delete",
  isAuthenticated,
  async (req: RequestExtended, res: Response) => {
    try {
      const userId = req.user._id;

      const username = req.user.username;

      if (username === "Visitor") {
        const favoritesByUserId = await Favorite.find({ user: userId });

        if (favoritesByUserId) {
          favoritesByUserId.forEach(async (item) => {
            await Favorite.deleteOne({ _id: item._id });
          });
        }
        await User.deleteOne({ _id: userId });
      }
      return res.status(200).json();
    } catch (error: any) {
      res.status(500).json({ error: 500, message: error.message });
    }
  }
);
