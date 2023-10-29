const z = require("zod");

const allJson = z.object({
  fetched_at: z.date(),
  data: z.array(
    z.object({
      season: z.string(),
      dates: z.array(
        z.object({
          date: z.string(),
          projects: z.array(
            z.object({
              link: z.string().url(),
              username: z.string(),
              message: z.string(),
              image: z.string(),
            })
          ),
        })
      ),
    })
  ),
});

const byProjects = z.object({
  fetched_at: z.date(),
  data: z.array(
    z.object({
      season: z.string(),
      showcaseDate: z.string(),
      projectLink: z.string(),
      projectIdx: z.number(),
      username: z.string(),
      message: z.string(),
      image: z.string(),
    })
  ),
});

module.exports = {
  allJson,
  byProjects,
};
