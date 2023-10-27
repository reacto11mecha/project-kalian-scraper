const fastify = require("fastify")({
  logger: true,
});

fastify.register(require("./src"));

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
});
