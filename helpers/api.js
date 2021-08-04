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
 * => [
 *      queueType: {
 *         tier: String ("IRON" / "BRONZE" / "SILVEER" / etc),
 *         rank: String ("I" / "II" / "III" / etc),
 *         leaguePoints: Int,
 *         wins: Int,
 *         losses: Int
 *      },  
 *      queueType: {
 *          tier: String ("IRON" / "BRONZE" / "SILVEER" / etc),
 *          rank: String ("I" / "II" / "III" / etc),
 *          leaguePoints: Int,
 *          wins: Int,
 *          losses: Int
 *      }
 *  ]
*/

async function getSummonerRank(region, encryptedSummonerId) {
    const {data} = await axios.get(
        `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
        HEADERS
    );
    return data.map(({queueType, tier, rank, leaguePoints, wins, losses}) => ({
        queueType: queueType === 'RANKED_SOLO_5x5' ? 'Ranked Solo' : 'Flex 5:5 Rank',
        tier, 
        rank, 
        leaguePoints, 
        wins, 
        losses
    }));
};

/** Gets the solo / flex matchIds from the API 
 * - each matchId is used to get more specific details about the match from the API
 * 
 * => {
 *      soloMatchIds: ["soloMatchId1", "soloMatchId2", ...],
 *      flexMatchIds: ["flexMatchId1", "flexMatchId2", ...]
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
 *      soloMatches: [ {id: soloMatch1, ...}, {id: soloMatch2, ...}, ...],
 *      flexMatches: [ {id: flexMatch1, ...}, {id: flexMatch2, ...}, ...]
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
    const flexMatchesResp = await axios.all(getFlexMatches);

    const matchData = ({data}) => ({
        [data.metadata.matchId]: {
            gameCreation: data.info.gameCreation,
            gameDuration: data.info.gameDuration,
            participants: data.info.participants.map(p => ({
                [p.summonerName]: {
                    win: p.win,
                    team: p.teamId,
                    championName: p.championName,
                    spell1: p.summoner1Id,
                    spell2: p.summoner2Id,
                    primaryRune: p.perks.styles[0].style,
                    secondaryRune: p.perks.styles[1].style,
                    kda: `${p.kills}/${p.deaths}/${p.assists}`,
                    champLevel: p.champLevel,
                    cs: p.totalMinionsKilled,
                    lane: p.lane,
                    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6]
                }
            }))
        }
    });
    const soloMatches = soloMatchesResp.map(matchData);
    const flexMatches = flexMatchesResp.map(matchData);
    return { soloMatches, flexMatches };
};

module.exports = {
    getSummonerProfile,
    getSummonerRank,
    getSummonerMatches
};