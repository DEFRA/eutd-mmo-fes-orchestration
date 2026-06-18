import * as test from 'tape';
const sinon = require('sinon');
import logger from '../../../src/logger';

import StorageNotes, { validateEntry } from '../../../src/services/handlers/storage-notes';
import * as fishValidator from '../../../src/validators/fish.validator';
import * as commodityValidator from '../../../src/validators/pssdCommodityCode.validator';
import * as documentValidator from '../../../src/validators/documentValidator';
import * as countriesValidator from '../../../src/validators/countries.validator';

const addProductUrl = '/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment';
const addedProductUrl = '/create-non-manipulation-document/:documentNumber/you-have-added-a-product';
const facilityDetailsUrl = '/create-non-manipulation-document/:documentNumber/add-storage-facility-details';
const facilityApprovalUrl = '/create-non-manipulation-document/:documentNumber/add-storage-facility-approval';

const baseCatch = {
  certificateType: 'non_uk',
  certificateNumber: 'CC-11111',
  issuingCountry: 'Spain',
  product: 'Atlantic cod',
  speciesCode: 'COD',
  scientificName: 'Gadus morhua',
  commodityCode: '03036310',
  productDescription: 'Frozen cod fillets',
  weightOnCC: '2222',
  netWeightProductArrival: '1111',
  netWeightFisheryProductArrival: '1100'
};

const withValidationStubs = async (fn) => {
  const stubs = [
    sinon.stub(fishValidator, 'validateSpeciesName').resolves({ isError: false }),
    sinon.stub(commodityValidator, 'validateCommodityCode').resolves({ isError: false }),
    sinon.stub(documentValidator, 'validateCompletedDocument').resolves(true),
    sinon.stub(documentValidator, 'validateSpecies').resolves(true),
    sinon.stub(countriesValidator, 'validateCountriesName').resolves({ isError: false })
  ];

  try {
    await fn();
  } finally {
    stubs.forEach((stub) => stub.restore());
  }
};

const assertNoErrors = (t, errors) => {
  t.true(errors);
  t.equals(typeof errors, 'object', 'errors result is an object');
  t.deepEquals(errors, {});
  t.equals(Object.keys(errors).length, 0, 'no validation errors are returned');
};

const assertExpectedErrors = (t, errors, expected) => {
  t.true(errors);
  t.equals(typeof errors, 'object', 'errors result is an object');
  t.deepEquals(errors, expected);
  t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
  t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
};

//------ TESTS FOR add-product-to-this-consignment -----
test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment with all mandatory fields validates as OK', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch }] };

      const { errors } = await handler({
        data,
        nextUrl: '',
        currentUrl: addProductUrl,
        errors: {}
      });

      assertNoErrors(t, errors);
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment with missing product validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch, product: undefined, scientificName: undefined, speciesCode: undefined }] };

      const { errors } = await handler({
        data,
        nextUrl: '',
        currentUrl: addProductUrl,
        errors: {}
      });

      assertExpectedErrors(t, errors, {
        'catches-0-product': 'sdAddProductToConsignmentProductNameErrorNull'
      });
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment with missing commodity code validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch, commodityCode: undefined }] };

      const { errors } = await handler({ data, nextUrl: '', currentUrl: addProductUrl, errors: {} });

      assertExpectedErrors(t, errors, {
        'catches-0-commodityCode': 'sdAddProductToConsignmentCommodityCodeErrorNull'
      });
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment with missing catch certificate number validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch, certificateNumber: undefined }] };

      const { errors } = await handler({ data, nextUrl: '', currentUrl: addProductUrl, errors: {} });

      assertExpectedErrors(t, errors, {
        'catches-0-certificateNumber': 'sdAddProductToConsignmentCertificateNumberErrorNull'
      });
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment with missing product description validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch, productDescription: undefined }] };

      const { errors } = await handler({ data, nextUrl: '', currentUrl: addProductUrl, errors: {} });

      assertExpectedErrors(t, errors, {
        'catches-0-productDescription': 'sdAddProductToConsignmentProductDescriptionErrorNull'
      });
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment with missing net product arrival validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch, netWeightProductArrival: undefined }] };

      const { errors } = await handler({ data, nextUrl: '', currentUrl: addProductUrl, errors: {} });

      assertExpectedErrors(t, errors, {
        'catches-0-netWeightProductArrival': 'sdAddProductToConsignmentNetWeightOfProductErrorNull'
      });
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment with missing fishery product arrival validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch, netWeightFisheryProductArrival: undefined }] };

      const { errors } = await handler({ data, nextUrl: '', currentUrl: addProductUrl, errors: {} });

      assertExpectedErrors(t, errors, {
        'catches-0-netWeightFisheryProductArrival': 'sdAddProductToConsignmentNetWeightOfFisheryProductErrorNull'
      });
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-product-to-this-consignment invalid (negative) net product arrival validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch, netWeightProductArrival: '-1' }] };

      const { errors } = await handler({ data, nextUrl: '', currentUrl: addProductUrl, errors: {} });

      assertExpectedErrors(t, errors, {
        'catches-0-netWeightProductArrival': 'sdNetWeightProductArrivalErrorMax2DecimalLargerThan0'
      });
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

//------ TESTS FOR you-have-added-a-product -----
test('/create-non-manipulation-document/:documentNumber/you-have-added-a-product with selected another product choice validates as OK', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addedProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch }], addAnotherProduct: 'No' };

      const { errors, next } = await handler({
        data,
        nextUrl: '',
        currentUrl: addedProductUrl,
        errors: {}
      });

      assertNoErrors(t, errors);
      t.equals(next, '/create-non-manipulation-document/:documentNumber/add-storage-facility-details', 'no branch routes to storage facility details');
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/you-have-added-a-product with unselected another product choice validates as error', async t => {
  try {
    await withValidationStubs(async () => {
      const handler = StorageNotes[addedProductUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
      const data = { catches: [{ ...baseCatch }], addAnotherProduct: 'notset' };

      const { errors, next } = await handler({
        data,
        nextUrl: '',
        currentUrl: addedProductUrl,
        errors: {}
      });

      assertExpectedErrors(t, errors, { addAnotherProduct: 'addAnotherProductNullError' });
      t.equals(next, addedProductUrl, 'invalid branch stays on the same page');
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

//------ TESTS FOR add-storage-facility-details -----
test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with all mandatory fields validates as OK', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: 'Hank Marvin',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: 'Seaham',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({
      data,
      nextUrl: '',
      currentUrl: facilityDetailsUrl,
      params: 0,
      errors: {}
    });

    assertNoErrors(t, errors);
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with missing facility name validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: 'Seaham',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityName': 'sdAddStorageFacilityDetailsErrorEnterTheFacilityName'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with missing address fields validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: 'Hank Marvin',
      facilityAddressOne: '',
      facilityAddressTwo: '',
      facilityTownCity: '',
      facilityPostcode: ''
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityAddressOne': 'sdAddStorageFacilityDetailsErrorEnterTheAddress'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with missing town or city validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: 'Hank Marvin',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: '',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityTownCity': 'sdAddStorageFacilityDetailsErrorEnterTheTown'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with missing building and street validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: 'Hank Marvin',
      facilityAddressOne: '',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: '',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityAddressOne': 'sdAddStorageFacilityDetailsErrorEnterTheBuilding',
      'storageFacilities-facilityTownCity': 'sdAddStorageFacilityDetailsErrorEnterTheTown'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-approval with missing Stored As validates as error', async t => {
  try {
    const handler = StorageNotes[facilityApprovalUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityApprovalNumber: 'AB-123'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityApprovalUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityStorage': 'sdAddStorageFacilityProductStoredNullError'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with whitespace facilityName, facilityAddressOne and facilityTownCity validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: ' ',
      facilityAddressOne: ' ',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: ' ',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityName': 'sdAddStorageFacilityDetailsErrorEnterTheFacilityName',
      'storageFacilities-facilityAddressOne': 'sdAddStorageFacilityDetailsErrorEnterTheBuilding',
      'storageFacilities-facilityTownCity': 'sdAddStorageFacilityDetailsErrorEnterTheTown'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with emoji in facilityName validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: 'Hank 😀 Marvin',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: 'Seaham',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityName': 'emojiCharactersNotPermitted'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with emoji in facilityAddressOne validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: 'Hank Marvin',
      facilityAddressOne: '🏠 Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: 'Seaham',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityAddressOne': 'emojiCharactersNotPermitted'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('/create-non-manipulation-document/:documentNumber/add-storage-facility-details with emoji in facilityTownCity validates as error', async t => {
  try {
    const handler = StorageNotes[facilityDetailsUrl];
      t.equals(typeof handler, 'function', 'route handler exists');
    const data = {
      facilityArrivalDate: '29/01/2019',
      facilityName: 'Hank Marvin',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: '🌊 Seaham',
      facilityPostcode: 'SE11EA'
    };

    const { errors } = await handler({ data, nextUrl: '', currentUrl: facilityDetailsUrl, params: 0, errors: {} });

    assertExpectedErrors(t, errors, {
      'storageFacilities-facilityTownCity': 'emojiCharactersNotPermitted'
    });
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

//------ TESTS FOR net weight arrival cross-field validation -----
const arrivalWeightBaseProduct = {
  certificateType: 'uk',
  productDescription: 'TestProduct',
  weightOnCC: '100',
};

test('validateEntry net weight arrival: fishery weight less than product weight - no cross-check error', async t => {
  try {
    const product = { ...arrivalWeightBaseProduct, netWeightProductArrival: '50', netWeightFisheryProductArrival: '30' };
    const { errors } = await validateEntry(product, 0, {});
    t.equals(typeof errors, 'object', 'validateEntry returns an errors object');
    t.equal(errors['catches-0-netWeightFisheryProductArrival'], undefined, 'no cross-check error when fishery weight < product weight');
    t.equals(Object.keys(errors).length, 1, 'only certificateNumber error remains for this helper setup');
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('validateEntry net weight arrival: fishery weight equal to product weight - no cross-check error', async t => {
  try {
    const product = { ...arrivalWeightBaseProduct, netWeightProductArrival: '50', netWeightFisheryProductArrival: '50' };
    const { errors } = await validateEntry(product, 0, {});
    t.equals(typeof errors, 'object', 'validateEntry returns an errors object');
    t.equal(errors['catches-0-netWeightFisheryProductArrival'], undefined, 'no cross-check error when fishery weight = product weight');
    t.equals(Object.keys(errors).length, 1, 'only certificateNumber error remains for this helper setup');
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('validateEntry net weight arrival: fishery weight exceeds product weight - sets cross-check error on fishery weight field', async t => {
  try {
    const product = { ...arrivalWeightBaseProduct, netWeightProductArrival: '50', netWeightFisheryProductArrival: '80' };
    const { errors } = await validateEntry(product, 0, {});
    t.equals(typeof errors, 'object', 'validateEntry returns an errors object');
    t.equal(errors['catches-0-netWeightFisheryProductArrival'], 'sdNetWeightFisheryProductArrivalExceedsProductArrival', 'cross-check error set when fishery weight > product weight');
    t.ok(errors['catches-0-certificateNumber'], 'certificateNumber required error is also present');
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('validateEntry net weight arrival: cross-check error applied at correct index', async t => {
  try {
    const product = { ...arrivalWeightBaseProduct, netWeightProductArrival: '50', netWeightFisheryProductArrival: '80' };
    const { errors } = await validateEntry(product, 2, {});
    t.equals(typeof errors, 'object', 'validateEntry returns an errors object');
    t.equal(errors['catches-2-netWeightFisheryProductArrival'], 'sdNetWeightFisheryProductArrivalExceedsProductArrival', 'cross-check error set on correct index');
    t.equal(errors['catches-0-netWeightFisheryProductArrival'], undefined, 'no cross-check error on wrong index');
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('validateEntry net weight arrival: cross-check not triggered when netWeightProductArrival has individual validation error', async t => {
  try {
    const product = { ...arrivalWeightBaseProduct, netWeightProductArrival: '-1', netWeightFisheryProductArrival: '80' };
    const { errors } = await validateEntry(product, 0, {});
    t.equals(typeof errors, 'object', 'validateEntry returns an errors object');
    t.equal(errors['catches-0-netWeightProductArrival'], 'sdNetWeightProductArrivalErrorMax2DecimalLargerThan0', 'individual error set on product arrival weight');
    t.equal(errors['catches-0-netWeightFisheryProductArrival'], undefined, 'no fishery error when product has individual error');
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('validateEntry net weight arrival: fishery individual error preserved when fishery does not exceed product weight and product is valid', async t => {
  try {
    const product = { ...arrivalWeightBaseProduct, netWeightProductArrival: '50', netWeightFisheryProductArrival: '-1' };
    const { errors } = await validateEntry(product, 0, {});
    t.equals(typeof errors, 'object', 'validateEntry returns an errors object');
    t.equal(errors['catches-0-netWeightFisheryProductArrival'], 'sdNetWeightProductFisheryArrivalErrorMax2DecimalLargerThan0', 'individual fishery error preserved');
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});

test('validateEntry net weight arrival: fishery individual error preserved when fishery also numerically exceeds product weight', async t => {
  try {
    const product = { ...arrivalWeightBaseProduct, netWeightProductArrival: '50', netWeightFisheryProductArrival: '80.123' };
    const { errors } = await validateEntry(product, 0, {});
    t.equals(typeof errors, 'object', 'validateEntry returns an errors object');
    t.equal(errors['catches-0-netWeightFisheryProductArrival'], 'sdNetWeightProductFisheryArrivalPositiveMax2Decimal', 'individual fishery format error preserved');
    t.ok(errors['catches-0-certificateNumber'], 'certificate number required error is also present');
  } catch (e) {
    t.fail('unexpected error in storage-notes handler test');
    logger.error(e);
    t.end(e);
    return;
  }
  t.end();
});
