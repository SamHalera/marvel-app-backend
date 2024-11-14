import express, { Request, Response } from "express";

import { Favorite } from "../models/Favorites";

import { RequestExtended } from "../types/types";
import { isAuthenticated } from "../middelware/isAuthenticated";

import { prepareAuthQueryForFetch } from "../utils/officialApiHelpers";
export const router = express.Router();

router.post(
  "/characters",
  isAuthenticated,
  async (req: RequestExtended, res: Response) => {
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

      const response = await fetch(
        `https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.API_KEY}${query}`
      );

      const data = await response.json();

      if (token) {
        const user = req.user;
        const favorites = await Favorite.find().populate({
          path: "user",
          select: "_id username token",
        });

        const characters = data.results;

        for (let i = 0; i < favorites.length; i++) {
          for (let j = 0; j < characters.length; j++) {
            if (favorites[i].itemId === characters[j]._id) {
              if (favorites[i].user.token === token) {
                characters[j]["isFavorite"] = true;
              } else {
                characters[j]["isFavorite"] = false;
              }
            }
          }
        }
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: 500, message: error.message });
    }
  }
);

router.get("/character/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(
      `https://lereacteur-marvel-api.herokuapp.com/character/${id}?apiKey=${process.env.API_KEY}`
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

///////OFFICIAL MARVEL API /////////

router.post("/official/characters", async (req, res) => {
  try {
    const authQueryParams = prepareAuthQueryForFetch();

    const { offset, count } = req.body;

    let optionsQuery = "";
    if (offset && offset > 0) {
      const offsetValue = offset * count - count;
      optionsQuery = `&offset=${offsetValue}`;
    }

    const response = await fetch(
      `${process.env.MARVEL_API_URL}/characters?${authQueryParams}${optionsQuery}`
    );

    const { data, attributionHTML } = await response.json();

    res.status(200).json({ data, attributionHTML });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
router.post("/official/characters/:id", async (req, res) => {
  try {
    const authQueryParams = prepareAuthQueryForFetch();

    const { id } = req.params;

    const response = await fetch(
      `${process.env.MARVEL_API_URL}/characters/${id}?${authQueryParams}`
    );

    const { data, attributionHTML } = await response.json();

    const { results } = data;
    const character = results[0];
    res.status(200).json({ ...results[0] });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/official/additionalItems-by-entity", async (req, res) => {
  try {
    const authQueryParams = prepareAuthQueryForFetch();

    const { resourceURI, label } = req.body;

    const response = await fetch(`${resourceURI}?${authQueryParams}`);

    const { data } = await response.json();

    const { results } = data;
    const additionalItem = results[0];
    const { id, title, thumbnail } = additionalItem;
    res.status(200).json({ id, title, thumbnail });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
