const fs = require("fs");
const parser = require("csv-parse/sync");
const process = require("process");
const yargs = require("yargs");

function createTokenObject(token) {

  // Exception catcher for older token packs that fixes the mapping for oversized smalls if it can find them
  // Ideally we should try to save the two scales separately rather than "inferring" the new value like this
  switch( token.ring.subject.scale ) {
    case 1.2:
      token.ring.subject.scale = 1.5
      break
    case 1.6:
      token.ring.subject.scale = 2
      break
    default:
      break
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
              describe: `A CSV file. The first row is ignored since it's assumed to contain column headers. 
              Subsequent rows should each correspond to a single creature and contain the following data in each column:  
              A (0) - Label/name                                                                      nb: this field is ignored
              B (1) - Compendium ID                                                                   nb: includes the system prefix, eg 'pf2e.pathfinder-bestiary'
              C (2) - Actor ID                                                                        nb: short form, eg 'Z7xWkQKCHGyd02B1'
              D (3) - Portrait image path
              E (4) - Token image path
              F (5) - Subject image path
              G (6) - Optional scale value                                                            empty => default (1)
              H (7) - Optional boolean indicating whether random images are to be enabled             empty/undefined => false
              I (8) - Optional boolean indicating whether to enable dynamic token ring                empty/undefined => true (it's recommended this should be enabled if there is subject artwork)
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
          randomImg: (row[7]==="TRUE") ? true : false,
          texture: {
            src: row[4], 
            scaleX: Number(row[6]) || undefined, 
            scaleY: Number(row[6]) || undefined,   
          },
          ring: {
            enabled: (row[8]==="FALSE") ? false : true,
            subject: {
              texture: row[5] || undefined,
              scale: Number(row[6]) || undefined
            }
          }
        },
    }))
    .reduce((accum, row) => {
        accum[row.pack] ??= {};
        accum[row.pack][row.id] = { actor: row.actor, token: createTokenObject(row.token) };
        return accum;
    }, {});

fs.writeFileSync(args.filename.replace(/\.csv$/, ".json"), JSON.stringify(jsonData, null, 2), { encoding: "utf-8" });