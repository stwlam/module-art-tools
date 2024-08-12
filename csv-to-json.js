const fs = require("fs");
const parser = require("csv-parse/sync");
const process = require("process");
const yargs = require("yargs");

function createTokenObject(token) {
  /* 
  //Deletes the subject object if there is no scale modification- basically, if you have set a subject assset substitution path, this option can reduce the number of redundant fields in this json. 
  //It's currently disabled because I think it's arguably better for the subject field to be hard mapped regardless rather than relying on the substitution? 
  if ( !token.ring.subject.scale ) {
    delete token.ring.subject
  }
  */
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
              G (6) - Optional scale value                                                            empty = default (1)
              H (7) - Optional boolean indicating whether random images are to be enabled             empty = undefined
              I (8) - Optional boolean indicating whether to enable dynamic token ring                empty = undefined, but it's recommended this should be enabled if there is subject artwork
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
          randomImg: !!row[7] || undefined,
          texture: {
            src: row[4], 
            scaleX: Number(row[6]) || undefined, 
            scaleY: Number(row[6]) || undefined,   
          },
          ring: {
            enabled: !!row[8] || undefined,
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
