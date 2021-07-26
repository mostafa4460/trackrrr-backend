"use strict";

const express = require("express");
const router = express.Router();

router.get("/:summonerName", (req, res, next) => {
    try {

    } catch (err) {
        return next(err);
    }
});

module.exports = router;