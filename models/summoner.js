"use strict";

const db = require("../db");

/** Related functions for summoners */

class Summoner {
    /** Checks if the summoner was cached in the DB
     * - if not, return false => this means the summoner hasn't been looked up before.
     * - next step: make the API call to find the summoner and then cache them in the DB.
     * 
     * name: in-game name of the user
     * region: name of server user plays on (NA, BR, JP, etc)
    */

    static async getCachedSummoner(name, region) {
        const summoners = await db.query(
            `SELECT `
        );
    }
}

module.exports = Summoner;