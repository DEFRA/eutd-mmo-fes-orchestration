#!/usr/bin/env node

/**
 * this thing is a command line utility to transform the current mock data to the format used by the real data
 * to the common name of the fish
 * -- use:
 * node transform_data -f fish/species_with_id.json
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

const newFilename = program.filename.split('.json')[0] + '_real_data_format.json';

fs.readFile(program.filename, 'utf8', (err, data) => {
  data = JSON.parse(data.toString());
  let withCode = data.map((datum) => {
    return {
      "faoCode": datum.faoCode,
      "faoName": `${datum.English_name}`,
      "matchedField": "faoName",
      "matchedValue": datum.English_name
    };
  });
  fs.writeFile(newFilename, JSON.stringify(withCode, null, '\t'), () => {
    console.info('Now your file is in the same format as the real data -- its name is ', newFilename);
  });
});

