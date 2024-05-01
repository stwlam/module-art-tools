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
              describe: "A CSV filename. The data is used as follows: A = label, B = key, C = source. D = portrait, E = thumbnail, F = token, G = scale, H = subject. Tag groups are I through ??.",
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
      "art": {
        "portrait" : row[3],
        "thumb" : row[4],
        "token" : row[5],
        "scale" : Number(row[6]) || undefined,
        "subject" : row[7],
      },
      "tagGroups":  {
        "family" : { "key": "family", "tags": row[8] ? row[8].toLowerCase().split(",") : undefined  },
        "ancestry" : { "key": "ancestry", "tags": row[9] ? row[9].toLowerCase().split(",") : undefined  },
        "equipment" : { "key": "equipment", "tags": row[10] ? row[10].toLowerCase().split(",") : undefined  },
        "stance" : { "key": "stance", "tags": row[11] ? row[11].toLowerCase().split(",") : undefined  },
        "armor" : { "key": "armor", "tags": row[12] ? row[12].toLowerCase().split(",") : undefined },
      },
    }))
    .map((element) => {
      for (const group in element.tagGroups) {
        if ( element.tagGroups[group].tags === undefined) { delete element.tagGroups[group] } 
      }
      jsonData.push(element)
    })

fs.writeFileSync(args.filename.replace(/\.csv$/, ".json"), JSON.stringify(jsonData, null, 2), { encoding: "utf-8" });
