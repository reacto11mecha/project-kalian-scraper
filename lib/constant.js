const fs = require("fs");
const path = require("path");

const resultDir = path.join(__dirname, "..", "result");
const imgDir = path.join(resultDir, "img");

const resultFilePath = path.join(resultDir, "all.json");
const byProjectLatestFile = path.join(resultDir, "projects-by-latest.json");
const byProjectOldestFile = path.join(resultDir, "projects-by-oldest.json");

if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir);
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

module.exports = {
  resultDir,
  imgDir,
  resultFilePath,
  byProjectLatestFile,
  byProjectOldestFile,
};
