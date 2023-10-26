"use strict";

// Read the .env file.
const dotenv = require("dotenv");
dotenv.config();

// Require the framework
const Fastify = require("fastify");

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
app.register(async function routes(fastify, options) {
  fastify.get("/", async (request, reply) => {
    return { data: "test" };
  });
});

export default async (req, res) => {
  await app.ready();
  app.server.emit("request", req, res);
};
