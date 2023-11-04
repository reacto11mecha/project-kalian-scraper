const fs = require("fs");
const path = require("path");

const { default: axios } = require("axios");
const prettier = require("prettier");
const { JSDOM } = require("jsdom");
const marked = require("marked");

const logger = require("./logger");
const screenshooter = require("./screenshooter");

const { allJson, byProjects } = require("../lib/schema");
const {
  resultFilePath,
  byProjectLatestFile,
  byProjectOldestFile,
} = require("../lib/constant");

(async () => {
  logger.info("Start fetching branches data...");

  // Branches data fetch
  const branchRequest = await axios.get(
    "https://api.github.com/repos/sandhikagalih/project-kalian/branches"
  );
  const branchesData = await branchRequest.data;

  logger.info(
    "Successfully fetched branches data, fethching all readme contents by branches"
  );

  const branches = branchesData.map(({ name }) => name);

  const readmeContents = await Promise.all(
    branches.map(async (branch) => {
      const request = await axios.get(
        `https://raw.githubusercontent.com/sandhikagalih/project-kalian/${branch}/README.md`
      );

      const rawData = await request.data;

      const formattedData = await prettier.format(rawData, {
        parser: "markdown",
      });

      const data = formattedData.trim();

      return { branch, data };
    })
  );
  // End of branches data fetch

  logger.info("Done fetching all of required data, now working with readme...");

  const perSeasonData = readmeContents.map((season) => {
    logger.info(`Working with ${season.branch} branch...`);

    // Sanitize text from unwanted content
    const text = season.data
      .replaceAll("<br>", "")
      .replaceAll("<br/>", "")
      .replaceAll("<br />", "")
      .replaceAll("<hr>", "")
      .replaceAll("####SPONSOR", "")
      .replaceAll("###SPONSOR", "");

    // Split every line
    const splitted = text.split(/\r?\n/);

    // Search for every showcase date
    const validDate = splitted
      // Map every line that started with ### and the content is the showcase date
      .map((d, idx) => {
        if (
          d.startsWith("###") &&
          !d.startsWith("###SPONSOR") &&
          !d.startsWith("####")
        ) {
          return { date: d.replace("###", "").trim(), idx };
        }
      })

      // Filter only the valid value
      .filter((d) => !!d);

    // Map every showcase date
    const dates = validDate.map((dateInfo, idx) => {
      let temp = [];

      // Initial file line to read
      const inital = dateInfo.idx;

      // Last line of the file to read
      const maxedValue =
        idx !== validDate.length - 1
          ? validDate[idx + 1].idx
          : splitted.length - 1;

      // Loop from the range
      for (let i = inital + 1; i < maxedValue; i++) {
        temp.push(`${splitted[i]}\n`);
      }

      const actualContent = marked.parse(
        // Merge value to get the original form
        temp
          .join("")
          .trim()

          // Replace [<link>] for consistent href
          .replaceAll("[", "")
          .replaceAll("]", "")
          .trim()
      );

      // Using JSDOM for more robust reading
      const dom = new JSDOM(`<!DOCTYPE html>${actualContent}`);

      return {
        date: dateInfo.date,
        projects: [...dom.window.document.querySelector("ol").children].map(
          (li, projectIdx) => {
            // Get anchor (project link) and strong element
            const linkElement = li.querySelector("a");
            const usernameElement = li.querySelector("strong");

            // Image path
            const image = `${season.branch
              .toUpperCase()
              .replace("MAIN", "SEASON-1")}-${dateInfo.date}-${projectIdx}.png`;

            // Actual project link
            const link = linkElement.href;

            if (!usernameElement) {
              linkElement.remove();

              return {
                link,
                message: li.innerHTML.trim(),
                username: "",
                image,
              };
            }

            linkElement.remove();
            usernameElement.remove();

            // Removing junk paragraph after link and username get deleted
            const junkParagraph = li.querySelector("p");

            const junks = [...junkParagraph.children];

            if (junks.length === 1) junkParagraph.remove();

            return {
              link,
              username: usernameElement.textContent,
              message: li.innerHTML.trim(),
              image,
            };
          }
        ),
      };
    });

    logger.info(`Done working with ${season.branch} branch.`);

    return {
      season: season.branch.toUpperCase().replace("MAIN", "SEASON-1"),
      dates,
    };
  });

  const fetched_at = new Date();

  const result = {
    fetched_at,
    data: perSeasonData,
  };

  logger.info(`Done working with all branches, validating...`);

  // Validate data
  const afterValidate = await allJson.parseAsync(result);

  fs.writeFileSync(resultFilePath, JSON.stringify(afterValidate, null, 2));

  const byProjectsOldest = afterValidate.data.flatMap((seasonItem) =>
    seasonItem.dates.flatMap((dateItem) =>
      dateItem.projects.map((projectItem, projectIdx) => ({
        season: seasonItem.season,
        showcaseDate: dateItem.date,
        projectLink: projectItem.link,
        projectIdx,
        username: projectItem.username,
        message: projectItem.message,
        image: `${seasonItem.season}-${dateItem.date}-${projectIdx}.png`,
      }))
    )
  );

  const baseProjectsData = {
    fetched_at,
    data: byProjectsOldest,
  };

  const byProjectData = await byProjects.parseAsync(baseProjectsData);

  fs.writeFileSync(byProjectOldestFile, JSON.stringify(byProjectData, null, 2));
  fs.writeFileSync(
    byProjectLatestFile,
    JSON.stringify(
      { ...byProjectData, data: byProjectData.data.reverse() },
      null,
      2
    )
  );

  logger.info("Done saving files. Screenshooting new links...");

  await screenshooter(afterValidate);

  logger.info("Finished.");
})();
