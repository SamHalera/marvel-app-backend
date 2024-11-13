const express = require("express");
const cloudinary = require("cloudinary").v2;
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Express, Request, Response } from "express";
import bodyParser from "body-parser";

import cors from "cors";

import { router as characterRouter } from "./routes/characters";
import { router as comicRouter } from "./routes/comics";
import { router as favoriteRouter } from "./routes/favorites";
import { router as userRouter } from "./routes/user";
import { MD5 } from "crypto-js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const app: Express = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(characterRouter);
app.use(comicRouter);
app.use(userRouter);
app.use(favoriteRouter);

//connect to DB

mongoose.connect(process.env.MONGODB_URI ?? "");

//HOME PAGE we get comics and characters limit to 20 itemz each
app.get("/", async (req, res) => {
  try {
    const { limit } = req.query;

    const query = `&limit=${limit}`;

    const responseCharacters = await fetch(
      `https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.API_KEY}${query}`
    );
    const responseComics = await fetch(
      `https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=${process.env.API_KEY}${query}`
    );

    const dataCharacters = await responseCharacters.json();
    const dataComics = await responseComics.json();
    const arrayOfData = [dataCharacters, dataComics];

    res.status(200).json(arrayOfData);
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/test/characters", async (req, res) => {
  try {
    const timestamp = Date.now();
    const privateMarvelAPIKey = process.env.MARVEL_PRIVATE_KEY;
    const publicMarvelAPIKey = process.env.MARVEL_PUBLIC_KEY;
    const hash = MD5(`${timestamp}${privateMarvelAPIKey}${publicMarvelAPIKey}`);
    const response = await fetch(
      `${process.env.MARVEL_API_URL}/characters?ts=${timestamp}&apikey=${publicMarvelAPIKey}&hash=${hash}&limit=20`
    );

    console.log(process.env.MARVEL_API_URL);
    const { data, attributionHTML } = await response.json();

    res.status(200).json({ data, attributionHTML });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
app.all("*", (req: Request, res: Response) => {
  res.status(404).json({ message: "MARVEL: THIS PAGE DOES NOT EXIST" });
});

app.listen(process.env.PORT, () => {
  console.log("Serverd started...");
});
