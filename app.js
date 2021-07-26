"use strict";

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const usersRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", usersRoutes);

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

module.exports = app;