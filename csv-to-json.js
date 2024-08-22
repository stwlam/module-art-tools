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
              - Portrait path
              - Thumbnail path
              - Token path
              - Subject path
              - ancestry tags (csv string => array)
              - category tags (csv string => array)
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
        "portrait" : row[5],
        "thumb" : row[6],
        "token" : row[7],
        "subject" : row[8],
        "scale" : Number(row[4]) || undefined,
      },
      "tags":  {
        "ancestry" : row[9] ? row[9].toLowerCase().split(",") : undefined,
        "category" : row[10] ? row[10].toLowerCase().split(",") : undefined,
        "equipment" : row[11] ? row[11].toLowerCase().split(",") : undefined,
        "features" : row[12] ? row[12].toLowerCase().split(",") : undefined,
        "family" : row[13] ? row[13].toLowerCase().split(",") : undefined,
        "special" : row[14] ? row[14].toLowerCase().split(",") : undefined,
      },
    }))
    .map((element) => {
      for (const group in element.tagGroups) {
        if ( element.tagGroups[group].tags === undefined) { delete element.tagGroups[group] } 
      }
      jsonData.push(element)
    })

fs.writeFileSync(args.filename.replace(/\.csv$/, ".json"), JSON.stringify(jsonData, null, 2), { encoding: "utf-8" });
