const z = require("zod");

const schema = z.object({
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
            })
          ),
        })
      ),
    })
  ),
});

module.exports = schema;
