export const decimalPlacesValidator = (value: number, helpers: any) => {

  if (countDecimals(value) > 2) {
    return helpers.error('number.decimal-places')
  }

  return value;
}

const countDecimals = (value: number): number => {
  if (Math.floor(value) === value) {
    return 0;
  }

  return value.toString().split('.')[1].length || 0;
}
