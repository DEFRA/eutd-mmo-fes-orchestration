#!/usr/bin/env node

/**
 * this thing is a command line utility to give an id to arrays of mock data
 * -- use:
 * node give_id -f vessels/vessels.json
 *
 * I found it was simpler to write it than to figure out how to add the ids with the IDE.
 */

const program = require('commander');
const uuid = require('uuid/v4');
const fs = require('fs');

program
  .version('0.1.0')
  .option('-f, --filename [filename]', 'Filename')
  .parse(process.argv);

const newFilename = program.filename.split('.json')[0] + '_with_id.json';

fs.readFile(program.filename, 'utf8', (err, data) => {
  data = JSON.parse(data.toString());
  let withId = data.map((datum) => {
    datum.id = uuid();
    return datum;
  });
  fs.writeFile(newFilename, JSON.stringify(withId, null, '\t'), () => {
    console.info('Now your file has ids -- its name is ', newFilename);
  });
});

