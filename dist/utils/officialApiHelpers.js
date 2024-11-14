"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDataCharactersResults = exports.prepareAuthQueryForFetch = void 0;
const crypto_js_1 = require("crypto-js");
const prepareAuthQueryForFetch = () => {
    const timestamp = Date.now();
    const privateMarvelAPIKey = process.env.MARVEL_PRIVATE_KEY;
    const publicMarvelAPIKey = process.env.MARVEL_PUBLIC_KEY;
    const hash = (0, crypto_js_1.MD5)(`${timestamp}${privateMarvelAPIKey}${publicMarvelAPIKey}`);
    return `ts=${timestamp}&apikey=${publicMarvelAPIKey}&hash=${hash}`;
};
exports.prepareAuthQueryForFetch = prepareAuthQueryForFetch;
const formatDataCharactersResults = (dataResults) => {
    const results = dataResults.map((item) => {
        return {
            _id: item.id,
            name: item.name,
            description: item.description,
            thumbnail: item.thumbnail,
        };
    });
    return results;
};
exports.formatDataCharactersResults = formatDataCharactersResults;
