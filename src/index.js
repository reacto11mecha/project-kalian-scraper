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

  const perProjects = data
    .flatMap((seasonItem) =>
      seasonItem.dates.flatMap((dateItem) =>
        dateItem.projects.map((projectItem, projectIdx) => ({
          season: seasonItem.season,
          showcaseDate: dateItem.date,
          projectLink: projectItem.link,
          projectIdx,
          username: projectItem.username,
          message: projectItem.message,
          imagePath: `${seasonItem.season}-${dateItem.date}-${projectIdx}.png`,
        }))
      )
    )
    .reverse();

  fastify.get("/", () => ({ data }));

  fastify.get("/per-projects", () => ({
    data: perProjects,
  }));

  fastify.get("/img/:img", (request, reply) =>
    reply
      .header("Content-Type", "image/png")
      .send(fs.readFileSync(path.join(imgDir, request.params.img)))
  );
}

module.exports = routes;
