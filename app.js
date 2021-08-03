"use strict";

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const summonerRoutes = require("./routes/summoners");

const app = express();
const schedule = require("node-schedule");
const Summoner = require("./models/summoner");

app.use(cors());
app.use(express.json());

app.use("/summoners", summonerRoutes);

/** Handle 404 errors -- this matches all other routes */

app.use((req, res, next) => {
    return next(new NotFoundError());
});
  
/** Generic error handler; anything unhandled goes here. */

app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;

    return res.status(status).json({
        error: { message, status },
    });
});

/** delete cached records that have been in the DB for too long 
 * => runs every day at midnight
*/
schedule.scheduleJob('0 0 * * *', async () => {
    await Summoner.cleanupCachedMatches();
    await Summoner.deleteCachedData();
});

module.exports = app;