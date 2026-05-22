/**
 * Departure vs arrival weight comparison checks for NMD (Storage Documents).
 *
 * Extracted into a standalone module to avoid a circular dependency between
 * storage-notes.ts (which imports utility validators from orchestration.service)
 * and orchestration.service.ts (which needs these checks at submission time).
 */

// Scenario 1 & 2: departure weight cannot exceed arrival weight
export function checkNetWeightProductDepartureExceedsArrival(ctch: any, index: number, errors: any) {
  if (
    !errors[`catches-${index}-netWeightProductDeparture`] &&
    ctch.netWeightProductDeparture &&
    ctch.netWeightProductArrival &&
    (+ctch.netWeightProductDeparture) > (+ctch.netWeightProductArrival)
  ) {
    errors[`catches-${index}-netWeightProductDeparture`] = 'sdNetWeightProductDepartureExceedsArrival';
  }
}

// Scenario 5: fishery product departure weight cannot exceed fishery product arrival weight
export function checkNetWeightFisheryProductDepartureExceedsArrival(ctch: any, index: number, errors: any) {
  if (
    !errors[`catches-${index}-netWeightFisheryProductDeparture`] &&
    ctch.netWeightFisheryProductDeparture &&
    ctch.netWeightFisheryProductArrival &&
    (+ctch.netWeightFisheryProductDeparture) > (+ctch.netWeightFisheryProductArrival)
  ) {
    errors[`catches-${index}-netWeightFisheryProductDeparture`] = 'sdNetWeightFisheryProductDepartureExceedsArrival';
  }
}

// Scenario 3: fishery product departure weight cannot exceed net product departure weight
export function checkNetWeightFisheryProductDepartureExceedsProductDeparture(ctch: any, index: number, errors: any) {
  if (
    !errors[`catches-${index}-netWeightFisheryProductDeparture`] &&
    !errors[`catches-${index}-netWeightProductDeparture`] &&
    ctch.netWeightFisheryProductDeparture &&
    ctch.netWeightProductDeparture &&
    (+ctch.netWeightFisheryProductDeparture) > (+ctch.netWeightProductDeparture)
  ) {
    errors[`catches-${index}-netWeightFisheryProductDeparture`] = 'sdNetWeightFisheryProductDepartureExceedsProductDeparture';
  }
}
