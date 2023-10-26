const fs = require("fs");
const path = require("path");

const { Cluster } = require("puppeteer-cluster");

const logger = require("./logger");
const schema = require("./schema");

const resultDir = path.join(__dirname, "..", "result");
const imgDir = path.join(resultDir, "img");

if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir);
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

const screenshooter = async (data) => {
  const validData = await schema.parseAsync(data);

  const alreadyFetchedImages = fs.readdirSync(imgDir);
  console.log(alreadyFetchedImages);
};

module.exports = screenshooter;
