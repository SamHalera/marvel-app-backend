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
exports.router = express_1.default.Router();
exports.router.post("/characters", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, skip, token } = req.body;
        let query = "";
        let limitForQuery = 100;
        if (name || skip) {
            if (name) {
                query += `&name=${name}`;
            }
            if (skip) {
                let skipForQuery = skip * limitForQuery - limitForQuery;
                query += `&skip=${skipForQuery}`;
            }
        }
        const response = yield fetch(`https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.API_KEY}${query}`);
        const data = yield response.json();
        if (token) {
            const user = req.user;
            const favorites = yield Favorites_1.Favorite.find().populate({
                path: "user",
                select: "_id username token",
            });
            const characters = data.results;
            for (let i = 0; i < favorites.length; i++) {
                for (let j = 0; j < characters.length; j++) {
                    if (favorites[i].itemId === characters[j]._id) {
                        if (favorites[i].user.token === token) {
                            characters[j]["isFavorite"] = true;
                        }
                        else {
                            characters[j]["isFavorite"] = false;
                        }
                    }
                }
            }
        }
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ error: 500, message: error.message });
    }
}));
exports.router.get("/character/:id", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const response = yield fetch(`https://lereacteur-marvel-api.herokuapp.com/character/${id}?apiKey=${process.env.API_KEY}`);
        const data = yield response.json();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
///////OFFICIAL MARVEL API /////////
exports.router.post("/official/characters", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authQueryParams = (0, officialApiHelpers_1.prepareAuthQueryForFetch)();
        const { offset, count } = req.body;
        let optionsQuery = "";
        if (offset && offset > 0) {
            const offsetValue = offset * count - count;
            optionsQuery = `&offset=${offsetValue}`;
        }
        const response = yield fetch(`${process.env.MARVEL_API_URL}/characters?${authQueryParams}${optionsQuery}`);
        const { data, attributionHTML } = yield response.json();
        res.status(200).json({ data, attributionHTML });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}));
exports.router.post("/official/characters/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authQueryParams = (0, officialApiHelpers_1.prepareAuthQueryForFetch)();
        const { id } = req.params;
        const response = yield fetch(`${process.env.MARVEL_API_URL}/characters/${id}?${authQueryParams}`);
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
exports.router.post("/official/additionalItems-by-entity", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authQueryParams = (0, officialApiHelpers_1.prepareAuthQueryForFetch)();
        const { resourceURI, label } = req.body;
        const response = yield fetch(`${resourceURI}?${authQueryParams}`);
        const { data } = yield response.json();
        const { results } = data;
        const additionalItem = results[0];
        const { id, title, thumbnail } = additionalItem;
        res.status(200).json({ id, title, thumbnail });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}));
