//TODO MECCB-960 Remove when confirmed no longer needed
// import { getEntityFromServer } from '../helpers/http';
// import { breakDownNameAndCode } from '../helpers/name';
//
// export interface Vessel {
//   pln: string,
//   vessel: string,
//   registrationNumber: string,
//   homePort: string
// }
// export const constructPath = (vesselName: string, pln: string) : string => {
//   return `/v1/vessels/search-exact?vesselName=${vesselName}&vesselPln=${pln}`;
// }
//
// export const getVesselData = async (nameWithCode: string, baseUrl: string) : Promise<Vessel | null> => {
//   const parsedAsNameAndCode = breakDownNameAndCode(nameWithCode);
//   if (parsedAsNameAndCode) {
//     const vesselName = parsedAsNameAndCode.name;
//     const pln = parsedAsNameAndCode.code;
//     const path = constructPath(vesselName, pln);
//     return await getEntityFromServer<Vessel>(baseUrl, path);
//   }
//   return null;
// }