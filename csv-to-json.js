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
              - ignored
              - key (string)
              - label (string)
              - source book (string)
              - scale (num) 
              - ancestry tags (csv string => array)
              - armor tags (csv string => array)
              - equipment tags (csv string => array)
              - feature tags (csv string => array)
              - family tags (csv string => array)
              - special tags (csv string => array)
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
      "label": row[2],
      "key": row[1],
      "source": row[3],
      "art": {
        "portrait" : "modules/pf2e-tokens-gallery/assets/portraits/" + row[1] + ".webp",
        "thumb" : "modules/pf2e-tokens-gallery/assets/thumbnails/" + row[1] + ".webp",
        "token" : "modules/pf2e-tokens-gallery/assets/tokens/" + row[1] + ".webp",
        "subject" : "modules/pf2e-tokens-gallery/assets/subjects/" + row[1] + ".webp",
        "scale" : Number(row[4]) || undefined,
      },
      "tags":  {
        "ancestry" : row[5] ? row[5].toLowerCase().split(",") : undefined,
        "armor" : row[6] ? row[6].toLowerCase().split(",") : undefined,
        "equipment" : row[7] ? row[7].toLowerCase().split(",") : undefined,
        "features" : row[8] ? row[8].toLowerCase().split(",") : undefined,
        "family" : row[9] ? row[9].toLowerCase().split(",") : undefined,
        "special" : row[10] ? row[9].toLowerCase().split(",") : undefined,
      },
    }))
    .map((element) => {
      for (const group in element.tagGroups) {
        if ( element.tagGroups[group].tags === undefined) { delete element.tagGroups[group] } 
      }
      jsonData.push(element)
    })

fs.writeFileSync(args.filename.replace(/\.csv$/, ".json"), JSON.stringify(jsonData, null, 2), { encoding: "utf-8" });
