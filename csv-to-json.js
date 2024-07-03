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
              describe: `Input is a CSV with the following data in each column: 
              A = label (string)
              B = key (string)
              C = source book (string)
              D = portrait (filepath)
              E = thumbnail (filepath)
              F = token (filepath)
              G = subject (filepath)
              H = scale (number)
              I = ancestry tags (csv string => array)
              J = armor tags (csv string => array)
              K = equipment tags (csv string => array)
              L = ability tags (csv string => array)
              M = feature tags (csv string => array)
              N = unique? (string)
              `
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

let jsonData = [];
const csvData = fs.readFileSync(args.filename, { encoding: "utf-8" });
const data = parser
    .parse(csvData)
    .slice(1)
    .map((row) => ({
      "label": row[0],
      "key": row[1],
      "source": row[2],
      "unique": row[13] || undefined,
      "art": {
        "portrait" : row[3],
        "thumb" : row[4],
        "token" : row[5],
        "subject" : row[6],
        "scale" : Number(row[7]) || undefined,
      },
      "tags":  {
        "ancestry" : row[8] ? row[8].toLowerCase().split(",") : undefined,
        "armor" : row[9] ? row[9].toLowerCase().split(",") : undefined,
        "equipment" : row[10] ? row[10].toLowerCase().split(",") : undefined,
        "abilities" : row[11] ? row[11].toLowerCase().split(",") : undefined,
        "features" : row[12] ? row[12].toLowerCase().split(",") : undefined,
      },
    }))
    .map((element) => {
      for (const group in element.tagGroups) {
        if ( element.tagGroups[group].tags === undefined) { delete element.tagGroups[group] } 
      }
      jsonData.push(element)
    })

fs.writeFileSync(args.filename.replace(/\.csv$/, ".json"), JSON.stringify(jsonData, null, 2), { encoding: "utf-8" });
