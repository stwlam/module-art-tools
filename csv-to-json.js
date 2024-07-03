const fs = require("fs");
const parser = require("csv-parse/sync");
const process = require("process");
const yargs = require("yargs");

function createTokenObject(token, ring) {
  if ( ring.subject.scale ) { 
    token.ring = ring
    token.flags = {pf2e: {linkToActorSize: false}} 
  } 
  return token
}

const args = yargs(process.argv.slice(2))
      .command(
        "$0 <filename>",
        "Convert a module art CSV file to JSON",
        () => {
          yargs
            .positional("filename", {
              describe: `A CSV file. The columns should contain the following data:  
              1- Label (ignored)
              2- Compendium ID
              3- Actor ID
              4- Actor image path
              5- Token image path
              6- Optional scale-ratio antecedent (consequent of 1)
              7- Optional boolean indicating whether random images are to be enabled"
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

const csvData = fs.readFileSync(args.filename, { encoding: "utf-8" });
const jsonData = parser
    .parse(csvData)
    .slice(1)
    .map((row) => ({
        pack: row[1],
        id: row[2],
        actor: row[3],
        token: {
          randomImg: !!row[6] || undefined,
          texture: {
            src: row[4], 
            scaleX: Number(row[5]) || undefined, 
            scaleY: Number(row[5]) || undefined,   
          }
        },
        ring: {
          subject: {
            scale: Number(row[5]) || undefined
          }
        }
    }))
    .reduce((accum, row) => {
        accum[row.pack] ??= {};
        accum[row.pack][row.id] = { actor: row.actor, token: createTokenObject(row.token, row.ring) };
        return accum;
    }, {});

fs.writeFileSync(args.filename.replace(/\.csv$/, ".json"), JSON.stringify(jsonData, null, 2), { encoding: "utf-8" });
