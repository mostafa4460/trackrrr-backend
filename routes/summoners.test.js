/** Tests for the summoners routes */

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Summoner = require("../models/summoner");

// dummy summoner
const FAKE_SUMMONER = {
    name: "fakeSummoner",
    profile: {},
    rank: {},
    matches: {}
};

// Mock the Summoner.getSummonerFromAPI fn to return FAKE_SUMMONER instead
jest.spyOn(Summoner, 'getSummonerFromAPI');
Summoner.getSummonerFromAPI.mockImplementation(() => FAKE_SUMMONER);

beforeAll(async () => {
    await db.query(
        `DELETE FROM summoners`
    );
});
afterEach(jest.clearAllMocks);
afterAll(async () => {
    await db.end();
});

/** Tests the GET /summoners route using region & summonerName */

describe("GET /summoners/:region/:summonerName", () => {

    /** First call to the route 
     * 
     * the summoner with region: fakeServer and name: fakeSummoner is not cached in the DB yet.
     * the summoner will come from the "API" (mock) and will be cached in the test DB after.
    */

    test("Looking up a summoner that is not already cached in the DB", async () => {
        // summoner does not exist in DB yet
        const notCachedSummoner = await Summoner.getCachedSummoner("fakeSummoner", "fakeServer");
        expect(notCachedSummoner).toBe(undefined);

        const getSummonerResp = await request(app).get("/summoners/fakeServer/fakeSummoner");
        expect(getSummonerResp.body).toEqual({ summoner: FAKE_SUMMONER });

        // summoner got cached into the DB after the route call
        const cachedSummoner = await Summoner.getCachedSummoner("fakeSummoner", "fakeServer");
        expect(cachedSummoner).not.toBe(undefined);
    });

    /** Second call to the route 
     * 
     * the summoner with region: fakeServer and name: fakeSummoner is already cached in the DB.
     * no API calls will be made to get the summoner.
    */

    test("Looking up a summoner that was looked up before", async () => {
        // summoner already exists in the DB
        const cachedSummoner = await Summoner.getCachedSummoner("fakeSummoner", "fakeServer");
        expect(cachedSummoner).not.toBe(undefined);

        const getSummonerResp = await request(app).get("/summoners/fakeServer/fakeSummoner");
        expect(getSummonerResp.body).toEqual({ summoner: {
            ...FAKE_SUMMONER,
            lastUpdated: expect.any(String)
        }});

        // the getSummonerFromAPI fn did not get called
        // instead, the summoner was retrieved from the DB
        expect(Summoner.getSummonerFromAPI.mock.calls.length).toBe(0);
    });
});