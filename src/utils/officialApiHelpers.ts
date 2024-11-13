import { MD5 } from "crypto-js";

export const prepareAuthQueryForFetch = () => {
  const timestamp = Date.now();
  const privateMarvelAPIKey = process.env.MARVEL_PRIVATE_KEY;
  const publicMarvelAPIKey = process.env.MARVEL_PUBLIC_KEY;
  const hash = MD5(`${timestamp}${privateMarvelAPIKey}${publicMarvelAPIKey}`);

  return `ts=${timestamp}&apikey=${publicMarvelAPIKey}&hash=${hash}`;
};

export const formatDataCharactersResults = (dataResults: any) => {
  const results = dataResults.map((item: any) => {
    return {
      _id: item.id,
      name: item.name,
      description: item.description,
      thumbnail: item.thumbnail,
    };
  });

  return results;
};
