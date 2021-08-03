"use strict";

const express = require("express");
const router = express.Router();
const Summoner = require("../models/summoner");

/** Get the cached summoner from the DB 
 * - if found, return cached summoner json
 * - else, get the summoner from the league API, cache it to the DB, then return it
*/

router.get("/:region/:summonerName", async (req, res, next) => {
    try {
        const {summonerName, region} = req.params;
        const cachedSummoner = await Summoner.getCachedSummoner(summonerName, region);

        let summoner;
        if (cachedSummoner) {
            summoner = {...cachedSummoner, lastUpdated: cachedSummoner.last_updated};
            delete summoner.last_updated;
        } else {
            summoner = await Summoner.getSummonerFromAPI(summonerName, region);
            await Summoner.cacheSummonerInDB(summoner, region);
        };
        return res.json({ summoner });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;