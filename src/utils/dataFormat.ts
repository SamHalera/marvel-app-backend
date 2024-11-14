import { CharactersType } from "../types/types";

export const formatCharactersArrayByComicId = (
  charactersArray: CharactersType,
  comicId: string
) => {
  const charactersForComicId = charactersArray.results.filter((character) => {
    return character.comics.find((comic: string) => comic === comicId);
  });

  return charactersForComicId;
};
