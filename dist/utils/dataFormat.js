"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCharactersArrayByComicId = void 0;
const formatCharactersArrayByComicId = (charactersArray, comicId) => {
    const charactersForComicId = charactersArray.results.filter((character) => {
        return character.comics.find((comic) => comic === comicId);
    });
    return charactersForComicId;
};
exports.formatCharactersArrayByComicId = formatCharactersArrayByComicId;
