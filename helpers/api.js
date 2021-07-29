/** Helper functions for calls to the league API */

"use strict";

const axios = require("axios");

/** League platforms mapped to regions 
 * - used for the League Match API, since it uses region names (americas, asia, europe)
 *   instead of platform names (na1, br1, la1, ...) 
*/

const PLATFORM_REGION = {
    "na1": "americas",
    "br1": "americas",
    "la1": "americas",
    "la2": "americas",
    "oc1": "americas",
    "kr": "asia",
    "jp1": "asia",
    "eun1": "europe",
    "euw1": "europe",
    "tr1": "europe",
    "ru": "europe"
}

/** Header with Riot API token */

const HEADERS = {
    headers: {
        "X-Riot-Token": process.env.API_KEY
    }
};

/** Gets the summoner's profile from the Summoner API 
 * 
 * => {
 *      id: String,
 *      accountId: String,
 *      puuid: String,
 *      name: String,
 *      profileIconId: Int,
 *      revisionDate: Unix epoch timestamp,
 *      summonerLevel: Int
 *  }
*/

async function getSummonerProfile(name, region) {
    const {data} = await axios.get(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`,
        HEADERS
    );
    return data;
};

/** Gets the summoner's rank from the League API 
 * 
 * => {
 *      queueType: {
 *         queueType: String ("RANKED_SOLO_5x5"),
 *         tier: String ("IRON" / "BRONZE" / "SILVEER" / etc),
 *         rank: String ("I" / "II" / "III" / etc),
 *         leaguePoints: Int,
 *         wins: Int,
 *         losses: Int
 *      },  
 *      queueType: {
 *          queueType: String ("RANKED_FLEX_SR"),
 *          tier: String ("IRON" / "BRONZE" / "SILVEER" / etc),
 *          rank: String ("I" / "II" / "III" / etc),
 *          leaguePoints: Int,
 *          wins: Int,
 *          losses: Int
 *      }
 *  }
*/

async function getSummonerRank(region, encryptedSummonerId) {
    const {data} = await axios.get(
        `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
        HEADERS
    );
    return data.reduce((ranks, currRank) => {
        ranks[currRank.queueType] = currRank;
        return ranks;
    }, {});
};

/** Gets the solo / flex matchIds from the API 
 * - each matchId is used to get more specific details about the match from the API
 * 
 * => {
 *      solo: ["soloMatchId1", "soloMatchId2", ...],
 *      flex: ["flexMatchId1", "flexMatchId2", ...]
 *    }
*/

async function getMatchIds(region, puuid, start=0, count=10) {
    const getSoloMatchIds = axios.get(
        `https://${PLATFORM_REGION[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=${start}&count=${count}`,
        HEADERS
    );
    const getFlexMatchIds = axios.get(
        `https://${PLATFORM_REGION[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=440&start=${start}&count=${count}`,
        HEADERS
    );
    const [soloResp, flexResp] = await axios.all([getSoloMatchIds, getFlexMatchIds]);
    return { soloMatchIds: soloResp.data, flexMatchIds: flexResp.data };
};

/** Gets the solo / flex matches from the API using the matchIds from getMatchIds
 * 
 * => {
 *      solo: [ {id: soloMatch1}, {id: soloMatch2}, ...],
 *      flex: [ {id: flexMatch1}, {id: flexMatch2}, ...]
 *    }
*/

async function getSummonerMatches(region, puuid, start=0, count=10) {
    const { soloMatchIds, flexMatchIds } = await getMatchIds(region, puuid, start, count);
    const getSoloMatches = soloMatchIds.map(id => axios.get(
        `https://${PLATFORM_REGION[region]}.api.riotgames.com/lol/match/v5/matches/${id}`,
        HEADERS
    ));
    const getFlexMatches = flexMatchIds.map(id => axios.get(
        `https://${PLATFORM_REGION[region]}.api.riotgames.com/lol/match/v5/matches/${id}`,
        HEADERS
    ));

    const soloMatchesResp = await axios.all(getSoloMatches);
    const soloMatches = soloMatchesResp.map(resp => ({
        [resp.data.metadata.matchId]: resp.data.info
    }));
    const flexMatchesResp = await axios.all(getFlexMatches);
    const flexMatches = flexMatchesResp.map(resp => ({
        [resp.data.metadata.matchId]: resp.data.info
    }));

    return { soloMatches, flexMatches };
};

module.exports = {
    getSummonerProfile,
    getSummonerRank,
    getSummonerMatches
};