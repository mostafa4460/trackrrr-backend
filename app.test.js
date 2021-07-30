const request = require("supertest");

const app = require("./app");
const db = require("./db");

test("404 not found error for unexisting pages", async () => {
    const resp = await request(app).get('/no-such-path');
    expect(resp.statusCode).toBe(404);
});

afterAll(function () {
    db.end();
});