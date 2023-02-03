const fs = require("fs");
const parser = require("csv-parse/sync");
const process = require("process");
const yargs = require("yargs");

const args = yargs(process.argv.slice(2))
      .command(
        "$0 <filename>",
        "Convert a module art CSV file to JSON",
        () => {
          yargs
            .positional("filename", {
              describe: "A CSV filename. The first column of the CSV is ignored. Columns 2-6 should be compendium ID, actor ID, actor image path, token image path, and an optional scale-ratio antecedent (consequent of 1), and an optional boolean indicating whether random images are to be enabled.",
            });
        }
      )
      .usage("Usage: node $0 <filename>")
      .check((args) => typeof args.filename === "string" &&
             fs.existsSync(args.filename) &&
             fs.statSync(args.filename).isFile())
      .help(false)
      .version(false)
      .parseSync();

const csvData = fs.readFileSync(args.filename, { encoding: "utf-8" });
const jsonData = parser.parse(csvData).slice(1).map((row) => ({
  pack: row[1],
  id: row[2],
  actor: row[3],
  token: row[5].trim() ? { img: row[4], scale: Number(row[5]) } : row[4],
  randomImg: !!row[6],
})).reduce((accum, row) => {
  accum[row.pack] ??= {};
  accum[row.pack][row.id] = { actor: row.actor, token: row.token };
  if (row.randomImg) accum[row.pack][row.id].randomImg = true;

  return accum;
}, {});

fs.writeFileSync(args.filename.replace(/\.csv$/, ".json"), JSON.stringify(jsonData, null, 2), { encoding: "utf-8" });
