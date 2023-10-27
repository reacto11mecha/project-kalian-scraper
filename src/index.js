const fs = require("fs");
const path = require("path");

const { resultFilePath, imgDir } = require("../lib/constant");
const schema = require("../lib/schema");

/**
 * Main gate for the data to flow
 *
 * @param {import("fastify").FastifyInstance} fastify
 * @param {import("fastify").FastifyPluginOptions} options
 */
async function routes(fastify, options) {
  const unvalidated = JSON.parse(fs.readFileSync(resultFilePath, "utf8"));
  const data = await schema.parseAsync(unvalidated);

  // await fastify.register(import("@fastify/compress"), {
  //   onUnsupportedEncoding: (encoding, request, reply) => {
  //     reply.code(406);

  //     return `We do not support the ${encoding} encoding.`;
  //   },
  // });
  await fastify.register(require("@fastify/cors"), { origin: "*" });
  await fastify.register(require("@fastify/rate-limit"), {
    max: 550,
    timeWindow: "1 minute",
  });

  await fastify.register(require("@fastify/swagger"), {
    swagger: {
      info: {
        title: "Swagger project kalian",
        description: "Testing the Fastify swagger API",
        version: "0.0.1",
      },
      externalDocs: {
        url: "https://github.com/sandhikagalih/project-kalian",
        description: "Find more info here",
      },
      consumes: ["application/json"],
      produces: ["application/json"],
    },
  });

  await fastify.register(require("@fastify/swagger-ui"), {
    routePrefix: "/",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => swaggerObject,
    transformSpecificationClone: true,
  });

  await fastify.register(require("./api")(data), { prefix: "/api" });

  await fastify.register(require("@fastify/static"), {
    root: imgDir,
    prefix: "/img",
  });
}

module.exports = routes;
