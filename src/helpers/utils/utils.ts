// 10 digits
export const getRandomNumber = (): Number => {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
};

export const getFAOAreaList = () : string[] => {
  return [
    'FAO18',
    'FAO21',
    'FAO27',
    'FAO31',
    'FAO34',
    'FAO37',
    'FAO41',
    'FAO47',
    'FAO48',
    'FAO51',
    'FAO57',
    'FAO58',
    'FAO61',
    'FAO67',
    'FAO71',
    'FAO77',
    'FAO81',
    'FAO87',
    'FAO88',
  ];
}