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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const User_1 = require("../models/User");
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.headers.authorization) {
            const tokenFromHeaders = req.headers.authorization.replace("Bearer ", "");
            const user = yield User_1.User.findOne({ token: tokenFromHeaders }).select("username _id email");
            if (!user) {
                return res.status(401).json({ error: 401, message: "Unauthorized!" });
            }
            else {
                req.user = user;
                return next();
            }
        }
        else {
            return res.status(401).json({ error: 401, message: "Unauthorized!" });
        }
    }
    catch (error) {
        console.error(error);
    }
});
exports.isAuthenticated = isAuthenticated;
