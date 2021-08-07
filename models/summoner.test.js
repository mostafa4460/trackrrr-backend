const db = require("../db");
const Summoner = require("./summoner");

const FAKE_SUMMONER = {
    name: "fakeSummoner",
    profile: {},
    rank: {},
    matches: {}
};

beforeAll(async () => {
    await db.query(
        `DELETE FROM summoners`
    );
});
afterAll(async () => {
    await db.end();
});

describe("Tests the Summoner model functions for retrieving and caching data", () => {
    test("Summoner.getCachedSummoner and Summoner.cacheSummonerInDB", async () => {
        // DB is empty at this point
        let foundSummoner = await Summoner.getCachedSummoner("fakeSummoner", "fakeServer");
        expect(foundSummoner).toBe(undefined);

        // cache a summoner in the DB
        await Summoner.cacheSummonerInDB(FAKE_SUMMONER, "fakeServer");
        foundSummoner = await Summoner.getCachedSummoner("fakeSummoner", "fakeServer");
        expect(foundSummoner).toEqual({
            ...FAKE_SUMMONER,
            last_updated: expect.anything()
        });
    });
});