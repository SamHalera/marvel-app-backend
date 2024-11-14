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
const express_1 = __importDefault(require("express"));
const Favorites_1 = require("../models/Favorites");
const isAuthenticated_1 = require("../middelware/isAuthenticated");
const officialApiHelpers_1 = require("../utils/officialApiHelpers");
const dataFormat_1 = require("../utils/dataFormat");
exports.router = express_1.default.Router();
exports.router.post("/comics", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, skip, token } = req.body;
        let query = "";
        let limitForQuery = 100;
        if (title || skip) {
            if (title) {
                query += `&title=${title}`;
            }
            if (skip) {
                let skipForQuery = skip * limitForQuery - limitForQuery;
                query += `&skip=${skipForQuery}`;
            }
        }
        const response = yield fetch(`https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=${process.env.API_KEY}${query}`);
        const data = yield response.json();
        if (token) {
            const user = req.user;
            const favorites = yield Favorites_1.Favorite.find().populate({
                path: "user",
                select: "_id username token",
            });
            const comics = data.results;
            for (let i = 0; i < favorites.length; i++) {
                for (let j = 0; j < comics.length; j++) {
                    if (favorites[i].itemId === comics[j]._id) {
                        if (favorites[i].user.token === token) {
                            comics[j]["isFavorite"] = true;
                        }
                        else {
                            comics[j]["isFavorite"] = false;
                        }
                    }
                }
            }
        }
        res.status(200).json(data);
    }
    catch (error) {
        console.log("error");
        res.status(500).json({ error: 500, message: error.message });
    }
}));
//GET COMICS BY CHARACTHER ID
//Page of one character with the comics in relation to him
exports.router.post("/comics/:characterId", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const characterId = req.params.characterId;
        const user = req.user;
        const response = yield fetch(`https://lereacteur-marvel-api.herokuapp.com/comics/${characterId}?apiKey=${process.env.API_KEY}`);
        const data = yield response.json();
        const character = data;
        if (user) {
            const favorite = yield Favorites_1.Favorite.findOne({
                user: user._id,
                itemId: characterId,
            }).populate({
                path: "user",
                select: "_id username email",
            });
            if (favorite) {
                character["isFavorite"] = true;
            }
        }
        res.status(200).json(character);
    }
    catch (error) {
        res.status(500).json({ error: 500, message: error.message });
    }
}));
exports.router.get("/comic/:id", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        const response = yield fetch(`https://lereacteur-marvel-api.herokuapp.com/comic/${id}?apiKey=${process.env.API_KEY}`);
        const charactersResponse = yield fetch(`https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.API_KEY}`);
        const comic = yield response.json();
        const characters = yield charactersResponse.json();
        const charactersForComicId = (0, dataFormat_1.formatCharactersArrayByComicId)(characters, comic._id);
        if (user) {
            const favorite = yield Favorites_1.Favorite.findOne({
                user: user._id,
                itemId: id,
            }).populate({
                path: "user",
                select: "_id username email",
            });
            if (favorite) {
                comic["isFavorite"] = true;
            }
        }
        res.status(200).json({ comic, charactersForComicId });
    }
    catch (error) {
        res.status(500).json({ error: 500, message: error.message });
    }
}));
///////OFFICIAL MARVEL API /////////
exports.router.post("/official/comics", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authQueryParams = (0, officialApiHelpers_1.prepareAuthQueryForFetch)();
        const { offset, count } = req.body;
        let optionsQuery = "";
        if (offset && offset > 0) {
            const offsetValue = offset * count - count;
            optionsQuery = `&offset=${offsetValue}`;
        }
        const response = yield fetch(`${process.env.MARVEL_API_URL}/comics?${authQueryParams}${optionsQuery}&limit=100`);
        const { data, attributionHTML } = yield response.json();
        res.status(200).json({ data, attributionHTML });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}));
exports.router.post("/official/comics/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authQueryParams = (0, officialApiHelpers_1.prepareAuthQueryForFetch)();
        const { id } = req.params;
        const response = yield fetch(`${process.env.MARVEL_API_URL}/comics/${id}?${authQueryParams}`);
        const { data, attributionHTML } = yield response.json();
        const { results } = data;
        const character = results[0];
        res.status(200).json(Object.assign({}, results[0]));
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}));
