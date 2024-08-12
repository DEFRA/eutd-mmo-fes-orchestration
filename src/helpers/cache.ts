//TODO MECCB-960 Remove when confirmed no longer needed
// import { promisify } from 'util';
// import * as jsonfile from 'jsonfile';

// const writeFile = jsonfile.writeFile;
// const readFile = jsonfile.readFile;

// const w = promisify(writeFile);
// const r = promisify(readFile);

// export const write = async (user_id: string, data: any, filepath: string): Promise<object> => {
//   const extantCache = await r(filepath) || [];
//   extantCache[user_id] = data;
//   // if I use the promisified version w, typescript says it wants only one argument. Clearly it's wrong,
//   // but I am not sure why.
//   return new Promise((resolve) => {
//     return writeFile(filepath, extantCache, { spaces: 2, EOL: '\r\n' }, (outcome) => {
//       return resolve(outcome);
//     });
//   });
// };

// export const read = async (user_id: string, filepath: string): Promise<object[]> => {
//   return await r(filepath)[user_id] || [];
// };

// export const deleteByUser = async (user_id: string, filepath: string): Promise<any> => {
//   const extantCache = await r(filepath) || [];
//   delete extantCache[user_id];
//   // if I use the promisified version w, typescript says it wants only one argument. Clearly it's wrong,
//   // but I am not sure why.
//   return new Promise((resolve) => {
//     return writeFile(filepath, extantCache, { spaces: 2, EOL: '\r\n' }, () => {
//       return resolve(true);
//     });
//   });
// };
