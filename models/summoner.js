"use strict";

const db = require("../db");
const axios = require("axios");
const { ExpressError } = require("../expressError");
const api = require("../helpers/api");

/** Related functions for summoners */

class Summoner {
    /** Checks if the summoner was cached in the DB
     * - if summoner not found, proceed to the league API
     * 
     * name: in-game name of the user
     * region: name of server user plays on (NA, BR, JP, etc)
    */

    static async getCachedSummoner(name, region) {
        const summoners = await db.query(
            `SELECT name, profile, rank, matches
            FROM summoners
            WHERE name = $1 AND region = $2`, 
            [name, region]
        );
        return summoners.rows[0];
    }

    /** Gets summoner from the League API and caches it in the DB, then returns it
     * - have to make 4 separate API calls to get all the data we need:
     *      => profile, rank, matchIds, matches
     * - if the API throws an error, catch it and throw that instead.
    */

    static async getSummonerFromAPI(name, region) {
        try {
            const { id, puuid, profileIconId, summonerLevel } = await api.getSummonerProfile(name, region);
            const rank = await api.getSummonerRank(region, id);
            const { soloMatches, flexMatches } = await api.getSummonerMatches(region, puuid);
            const summoner = {
                name,
                profile: { profileIconId, summonerLevel },
                rank,
                matches: {
                    solo: soloMatches,
                    flex: flexMatches
                }
            };
            return summoner;
        } catch (err) {
            const {message, status_code} = err.response.data.status;
            throw new ExpressError(message, status_code);
        };
    }

    /** Caches the whole summoner in the DB 
     * 
     * summoner =>
     * {
     *      name,
     *      profile: { 
     *          profileIconId, 
     *          summonerLevel 
     *      },
     *      rank: {
     *          RANKED_SOLO_5x5: {
     *              tier,
     *              rank,
     *              leaguePoints,
     *              wins,
     *              losses
     *          },
     *          RANKED_FLEX_SR: { SAME }
     *      },
     *      matches: {
     *          solo: [
     *              {
     *                  matchId: {
     *                      gameCreation,
     *                      gameDuration,
     *                      participants [
     *                          {
     *                              championName,
     *                              summoner1Id,
     *                              summoner2Id,
     *                              perks.styles[0].style,
     *                              perks.styles[1].style,
     *                              kills,
     *                              deaths,
     *                              assists,
     *                              champLevel,
     *                              totalMinionsKilled,
     *                              lane,
     *                              item0,
     *                              item1,
     *                              item2,
     *                              item3,
     *                              item4,
     *                              item5,
     *                              item6
     *                          }
     *                      ]                      
     *                  }
     *              }    
     *          ],
     *          flex: [ {SAME} ]
     *      }
     * }
    */

    static async cacheSummonerInDB(summoner, region) {
        const {name, profile, rank, matches} = summoner;
        await db.query(
            `INSERT INTO summoners(name, region, profile, rank, matches)
            VALUES ($1, $2, $3, $4, $5)`,
            [name, region, JSON.stringify(profile), JSON.stringify(rank), JSON.stringify(matches)]
        );
    }
}

module.exports = Summoner;