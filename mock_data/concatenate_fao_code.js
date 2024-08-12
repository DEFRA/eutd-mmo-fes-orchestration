#!/usr/bin/env node

/**
 * this thing is a command line utility to attach the fao code (actually called differently in the mock data, but still)
 * to the common name of the fish
 * -- use:
 * node concatenate_fao_code -f fish/species_with_id.json -c faoCode
 *
 * I found it was simpler to write it than to figure out how to add the ids with the IDE.
 */

const program = require('commander');
const uuid = require('uuid/v4');
const fs = require('fs');

program
  .version('0.1.0')
  .option('-f, --filename [filename]', 'Filename')
  .option('-c, --code [code]', 'Code name')
  .parse(process.argv);

const newFilename = program.filename.split('.json')[0] + '_with_fao_code.json';

fs.readFile(program.filename, 'utf8', (err, data) => {
  data = JSON.parse(data.toString());
  let withCode = data.map((datum) => {
    datum.English_name = `${datum.English_name} (${datum[program.code]})`;
    return datum;
  });
  fs.writeFile(newFilename, JSON.stringify(withCode, null, '\t'), () => {
    console.info('Now your file has the fao code attached -- its name is ', newFilename);
  });
});

