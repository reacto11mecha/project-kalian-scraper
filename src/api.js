const { z } = require("zod");
const schema = require("../lib/schema");

/**
 *
 * @param {z.infer<schema>} data
 * @returns
 */
const routes =
  (data) =>
  /**
   *
   * @param {import("fastify").FastifyInstance} fastify
   * @param {import("fastify").FastifyPluginOptions} options
   */
  async (fastify, options) => {
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
            imagePath: `/img/${seasonItem.season}-${dateItem.date}-${projectIdx}.png`,
          }))
        )
      )
      .reverse();

    fastify.get("/", () => ({ data }));

    fastify.get("/per-projects", () => ({
      data: perProjects,
    }));
  };

module.exports = routes;
