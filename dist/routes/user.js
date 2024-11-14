"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const cloudinary = require("cloudinary").v2;
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const uid2_1 = __importDefault(require("uid2"));
const sha256_1 = __importDefault(require("crypto-js/sha256"));
const enc_base64_1 = __importDefault(require("crypto-js/enc-base64"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const isAuthenticated_1 = require("../middelware/isAuthenticated");
const convertToBase64_1 = require("../utils/convertToBase64");
const brevoApi_1 = require("../libs/brevoApi");
const Favorites_1 = require("../models/Favorites");
exports.router = express_1.default.Router();
exports.router.post("/user/forgotten-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_1.User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ message: "Unauthotized!" });
        }
        if (!process.env.FRONT_URL) {
            return res.status(401).json({ error: "FRONT URL IS MISSING!" });
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
        yield (0, brevoApi_1.brevoSendEmail)(paramsForBrevo, to, emailTemplateId);
        return res.status(201).json({ success: "Email has been sent" });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
}));
exports.router.post("/user/reset-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { password, token } = req.body;
        if (!password) {
            return res.status(400).json({ message: "This fiel is required!" });
        }
        const user = yield User_1.User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: "UnAthourized" });
        }
        const salt = (0, uid2_1.default)(16);
        const hash = (0, sha256_1.default)(password + salt).toString(enc_base64_1.default);
        user.salt = salt;
        user.hash = hash;
        yield user.save();
        res.status(200).json({ success: "Reset successfully!" });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
}));
exports.router.post("/user/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const existingUser = yield User_1.User.findOne({ email: email });
        if (existingUser && existingUser.username === "Visitor") {
            console.log("visitor exist");
            yield User_1.User.deleteOne({ _id: existingUser._id });
        }
        if (existingUser !== null) {
            return res.status(409).json({ message: "This email already exists!" });
        }
        const salt = (0, uid2_1.default)(16);
        const hash = (0, sha256_1.default)(password + salt).toString(enc_base64_1.default);
        const token = (0, uid2_1.default)(64);
        const newUser = new User_1.User({
            email,
            username,
            token,
            hash,
            salt,
        });
        yield newUser.save();
        res.status(201).json({
            token: newUser.token,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.router.post("/user/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required!",
            });
        }
        const user = yield User_1.User.findOne({ email: email });
        if (user === null) {
            return res.status(401).json({ message: "Unauthorized!" });
        }
        const newHash = (0, sha256_1.default)(password + user.salt).toString(enc_base64_1.default);
        if (newHash !== user.hash) {
            return res.status(401).json({ message: "Unauthorized!" });
        }
        res.status(200).json({
            token: user.token,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.router.get("/user/profile", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById({ _id: req.user._id }).select("username email avatar -_id");
        return res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.router.get("/user/avatar", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById({ _id: req.user._id }).select("avatar -_id");
        return res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.router.post("/user/profile", isAuthenticated_1.isAuthenticated, (0, express_fileupload_1.default)(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, newPassword, picture } = req.body;
    try {
        const user = yield User_1.User.findById({ _id: req.user._id });
        if (user === null) {
            return res.status(401).json({ message: "Unauthorized!" });
        }
        if (username) {
            user.username = username;
        }
        if (!password && newPassword) {
            return res.status(400).json({
                error: "password",
                message: "It seems you forget to enter your current password",
            });
        }
        else {
            if (password && newPassword) {
                const newHash = (0, sha256_1.default)(password + user.salt).toString(enc_base64_1.default);
                if (newHash !== user.hash) {
                    return res
                        .status(400)
                        .json({ type: "error", message: "Invalid credentials" });
                }
                else {
                    const salt = (0, uid2_1.default)(16);
                    const hash = (0, sha256_1.default)(newPassword + salt).toString(enc_base64_1.default);
                    user.salt = salt;
                    user.hash = hash;
                }
            }
        }
        if (req.files) {
            let userFolderPath;
            let previousPublicId;
            if (!user.avatar) {
                const userFolder = yield cloudinary.api.create_folder(`/marvel/users/${user._id}`);
                userFolderPath = userFolder.path;
            }
            else {
                const userFolder = `/marvel/users/${user._id}`;
                userFolderPath = userFolder;
                //if user has already a picture we keep its public_id in order to delete it after uploading the new one
                previousPublicId = user.avatar.public_id;
            }
            const pictureToUpload = req.files.picture;
            const transformedPicture = (0, convertToBase64_1.convertToBase64)(pictureToUpload);
            const pictureToSave = yield cloudinary.uploader.upload(transformedPicture, { folder: userFolderPath });
            user.avatar = pictureToSave;
            if (previousPublicId) {
                yield cloudinary.uploader.destroy(previousPublicId, {
                    folder: userFolderPath,
                });
            }
        }
        yield user.save();
        return res.status(200).json({
            email: user.email,
            username: user.username,
            avatar: user.avatar,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.router.delete("/user/delete", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const username = req.user.username;
        console.log(username);
        if (username === "Visitor") {
            const favoritesByUserId = yield Favorites_1.Favorite.find({ user: userId });
            if (favoritesByUserId) {
                favoritesByUserId.forEach((item) => __awaiter(void 0, void 0, void 0, function* () {
                    yield Favorites_1.Favorite.deleteOne({ _id: item._id });
                }));
            }
            yield User_1.User.deleteOne({ _id: userId });
        }
        return res.status(200).json();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
