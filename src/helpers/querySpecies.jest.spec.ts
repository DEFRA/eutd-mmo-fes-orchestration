import { calculateRank, querySpecies } from "./querySpecies";

const speciesArray: any = [
  {
    "id": "GBR-2022-CC-47A29D1D9-37f28405-f2ca-4d0a-9abb-233eea3e9278",
    "species": "Atlantic cod (COD)",
    "speciesCode": "COD",
    "faoName": "Atlantic cod",
    "faoCode": "cod",
    "scientificName": "some fish",
    "commonNames": [
      "cod",
      "nice fish"
    ]
  },
  {
    "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
    "species": "Dwarf codling (AIM)",
    "speciesCode": "AIM",
    "faoName": "Dwarf codling",
    "faoCode": "AIM"
  },
  {
    "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
    "species": "Artic cod (ATG)",
    "speciesCode": "ATG",
    "faoName": "Artic cod",
    "faoCode": "ATG"
  },
  {
    "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
    "species": "East siberian cod (ATV)",
    "speciesCode": "ATV",
    "faoName": "East siberian cod",
    "faoCode": "ATV"
  },
  {
    "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
    "species": "Crocodile snake eel (AOY)",
    "speciesCode": "AOY",
    "faoName": "Crocodile snake eel",
    "faoCode": "AOY"
  },
  {
    "id": "GBR-2022-CC-47A29D1D9-6a36cb38-e985-4647-ba20-fcaafc54e662",
    "species": "Smallscale codlet (BVQ)",
    "speciesCode": "BVQ",
    "faoName": "Smallscale codlet",
    "faoCode": "BVQ"
  }
];

describe('querySpecies()', () => {
  it('should return an empty array if the the query is empty', () => {
    const result = querySpecies(null as any, speciesArray);
    expect(result).toEqual([]);
  });

  it('should return an rank of 1 if the fao code matches', () => {
    const result = calculateRank(speciesArray[0], "cod");
    expect(result.rank).toBe(1);
  });

  it('should return an rank of 10 if the fao name matches', () => {
    const result = calculateRank(speciesArray[0], "atlantic cod");
    expect(result.rank).toBe(10);
  });

  it('should return an rank of 20 if the scientific name matches', () => {
    const result = calculateRank(speciesArray[0], "some fish");
    expect(result.rank).toBe(20);
  });

  it('should return an rank of 20 if the common names matches', () => {
    const result = calculateRank(speciesArray[0], "nice fish");
    expect(result.rank).toBe(20);
  });

  it('should return an rank of 100 if nothing matches', () => {
    const result = calculateRank(speciesArray[0], "steak");
    expect(result.rank).toBe(100);
  });
});