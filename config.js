"use strict";

require("dotenv").config();

const PORT = +process.env.PORT || 3001;

function getDatabaseUri() {
    return (process.env.NODE_ENV === "test")
        ? "trackrrr_test"
        : process.env.DATABASE_URL || "trackrrr";
};

module.exports = {
    PORT,
    getDatabaseUri
};