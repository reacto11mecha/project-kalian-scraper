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
    "https://api.github.com/repos/sandhikagalih/project-kalian/branches",
  );
  const branchesData = await branchRequest.data;

  logger.info(
    "Successfully fetched branches data, fethching all readme contents by branches",
  );

  const branches = branchesData.map(({ name }) => name);

  const readmeContents = await Promise.all(
    branches.map(async (branch) => {
      const request = await axios.get(
        `https://raw.githubusercontent.com/sandhikagalih/project-kalian/${branch}/README.md`,
      );

      const rawData = await request.data;

      const formattedData = await prettier.format(rawData, {
        parser: "markdown",
      });

      const data = formattedData.trim();

      return { branch, data };
    }),
  );
  // End of branches data fetch

  logger.info("Done fetching all of required data, now working with readme...");

  const perSeasonData = await Promise.all(
    readmeContents.map(async (season) => {
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
      const dates = await Promise.all(
        validDate.map(async (dateInfo, idx) => {
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

          // Merge value to get the original form
          const rawText = temp.join("").trim();

          // Entering read line by line mode per project
          const splittedRawText = rawText.split(/\r?\n/);

          const projectsBase = splittedRawText
            .map((element, idx) => {
              const splittedNumber = element.split(".");

              const projectNumber = parseInt(splittedNumber[0]);
              const link = splittedNumber
                .slice(1)
                .join(".")
                .trim()
                .replace("[", "")
                .replace("]", "");

              if (
                !isNaN(projectNumber) &&
                new RegExp("^(http|https)://", "i").test(link)
              ) {
                return { projectIdx: projectNumber - 1, link, arrayIdx: idx };
              }
            })
            .filter((v) => !!v);

          const projects = await Promise.all(
            projectsBase.map(async (project, idx) => {
              // Image path
              const image = `${season.branch
                .toUpperCase()
                .replace("MAIN", "SEASON-1")}-${dateInfo.date}-${idx}.png`;

              const usernameDOM = new JSDOM(
                `<!DOCTYPE html>${marked.parse(
                  splittedRawText[project.arrayIdx + 1].trim(),
                )}`,
              );
              const usernameElement =
                usernameDOM.window.document.querySelector("strong");

              const username = usernameElement
                ? usernameElement.textContent
                : "";

              let secondTemp = [];

              // Initial project to read
              const initial = project.arrayIdx + 2;

              // Last line of the project to read
              const maxedValue =
                idx !== projectsBase.length - 1
                  ? projectsBase[idx + 1].arrayIdx
                  : splittedRawText.length - 1;

              // Loop from the range
              for (let i = initial + 1; i < maxedValue; i++) {
                secondTemp.push(`${splittedRawText[i].trim()}\n`);
              }

              // Merge value to get the original form
              const projectRawText = secondTemp.join("").trim();
              const prettifyProject = await prettier.format(projectRawText, {
                parser: "markdown",
              });

              const message = marked.parse(prettifyProject).trim();

              return {
                image,
                username,
                message,
                link: project.link,
              };
            }),
          );

          return {
            date: dateInfo.date,
            projects,
          };
        }),
      );

      logger.info(`Done working with ${season.branch} branch.`);

      return {
        season: season.branch.toUpperCase().replace("MAIN", "SEASON-1"),
        dates,
      };
    }),
  );

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
      })),
    ),
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
      2,
    ),
  );

  logger.info("Done saving files. Screenshooting new links...");

  await screenshooter(afterValidate);

  logger.info("Finished.");
})();
