const fs = require("fs");
const path = require("path");

const { Cluster } = require("puppeteer-cluster");

const logger = require("./logger");

const { allJson } = require("../lib/schema");
const { imgDir } = require("../lib/constant");

const errorImage = fs.readFileSync(path.join(__dirname, "error.png"));

const screenshooter = async (data) => {
  const validData = await allJson.parseAsync(data);

  const alreadyFetchedImages = fs.readdirSync(imgDir);

  const flattenedData = validData.data.flatMap((seasonItem) => {
    return seasonItem.dates.flatMap((dateItem) => {
      return dateItem.projects.map((projectItem, projectIdx) => {
        return {
          season: seasonItem.season,
          showcaseDate: dateItem.date,
          projectLink: projectItem.link,
          projectIdx: projectIdx,
        };
      });
    });
  });

  const imagesToFetch = flattenedData
    .map((project) => ({
      projectLink: project.projectLink,
      imgPath: `${project.season}-${project.showcaseDate}-${project.projectIdx}.png`,
    }))
    .filter((each) => !alreadyFetchedImages.includes(each.imgPath));

  if (imagesToFetch.length > 0) {
    logger.info(
      `Unfetched screenshot image(s): ${imagesToFetch.length} project(s)`
    );

    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 3,
      puppeteerOptions: {
        defaultViewport: { width: 1920, height: 1080 },
      },
    });

    await cluster.task(async ({ page, data: { imgPath, projectLink } }) => {
      logger.info(`[FETCH] ${projectLink} | ${imgPath}`);

      const actualImgPath = path.join(imgDir, imgPath);

      try {
        logger.info(`[FETCHING] ${projectLink} | ${imgPath}`);

        await page.goto(projectLink, {
          waitUntil: "networkidle0",
          timeout: 60 * 1000,
        });

        await page.screenshot({
          path: actualImgPath,
        });

        logger.info(`[FETCHED] ${projectLink} | ${imgPath}`);
      } catch (e) {
        fs.writeFileSync(actualImgPath, errorImage);
        logger.error(`[FAILED] ${projectLink} | ${imgPath}`);
      }
    });

    imagesToFetch.forEach((image) => cluster.queue(image));

    await cluster.idle();
    await cluster.close();
  }

  logger.info(
    imagesToFetch.length > 0 ? "[FETCH] done" : "[FETCH] all images are fetched"
  );
};

module.exports = screenshooter;
