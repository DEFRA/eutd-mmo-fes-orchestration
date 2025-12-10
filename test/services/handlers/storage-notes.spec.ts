import * as test from 'tape';
import logger from '../../../src/logger';

import StorageNotes from '../../../src/services/handlers/storage-notes';

//------ TESTS FOR /create-storage-document/add-product-to-this-consignment -----
test('/create-storage-document/:documentNumber/add-product-to-this-consignment with all mandatory fields validates as OK', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with missing product validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-product': 'Enter the FAO code or product name'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with missing commodity code validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-commodityCode': 'Enter the commodity code'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with missing catch certificate number validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-certificateNumber': 'Enter the document number'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with missing export weight validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-productWeight': 'Enter the export weight in kg'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with missing date product entered the UK validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-dateOfUnloading': 'Enter the date product entered the UK'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with missing place product entered the UK validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-placeOfUnloading': 'Enter the place product entered the UK'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with missing transport details validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-transportUnloadedFrom': 'Enter the transport details'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment with whitespace product, commodityCode, certificateNumber, placeOfUnloading and transportUnloadedFrom validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: ' ',
          commodityCode: ' ',
          certificateNumber: ' ',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: ' ',
          transportUnloadedFrom: ' '
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-product': 'Enter the FAO code or product name',
      'catches-0-commodityCode': 'Enter the commodity code',
      'catches-0-certificateNumber': 'Enter the document number',
      'catches-0-placeOfUnloading': 'Enter the place product entered the UK',
      'catches-0-transportUnloadedFrom': 'Enter the transport details'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment invalid (negative) numbers in productWeight validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '-1',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-productWeight':
        'Enter the export weight as a whole number larger than 0, like 500'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/:documentNumber/add-product-to-this-consignment invalid (floating point) numbers in productWeight validates as error', async t => {
  try {
    const currentUrl =
      '/create-storage-document/:documentNumber/add-product-to-this-consignment';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '11.11',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      'catches-0-productWeight':
        'Enter the export weight as a whole number, like 500'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

//------ TESTS FOR /create-storage-document/you-have-added-a-product -----
test('/create-storage-document/you-have-added-a-product with selected another product choice details validates as OK', async t => {
  try {
    const currentUrl = '/create-storage-document/you-have-added-a-product';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover'
        }
      ],
      addAnotherProduct: 'No'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {};

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/you-have-added-a-product with unselected another product choice details validates as error', async t => {
  try {
    const currentUrl = '/create-storage-document/you-have-added-a-product';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover'
        }
      ],
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      addAnotherProduct: 'Select yes if you need to add another product'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

//------ TESTS FOR /create-storage-document/add-storage-facility-details -----
test('/create-storage-document/add-storage-facility-details with all mandatory fields validates as OK', async t => {
  try {
    const currentUrl = '/create-storage-document/add-storage-facility-details';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      facilityName: 'Hank Marvin',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: 'Seaham',
      facilityPostcode: 'SE11EA',
      facilityStorage: 'Chilled',
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/add-storage-facility-details with missing facility name fields validates as error', async t => {
  try {
    const currentUrl = '/create-storage-document/add-storage-facility-details';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: 'Seaham',
      facilityPostcode: 'SE11EA',
      facilityStorage: 'Chilled',
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'storageFacilities-facilityName': 'Enter the facility name'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/add-storage-facility-details with missing address fields validates as error', async t => {
  try {
    const currentUrl = '/create-storage-document/add-storage-facility-details';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      facilityName: 'Hank Marvin',
      facilityAddressOne: '',
      facilityAddressTwo: '',
      facilityTownCity: '',
      facilityPostcode: '',
      facilttyStorage: 'Chilled',
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'storageFacilities-facilityAddressOne': 'Enter the address'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/add-storage-facility-details with missing town or city field validates as error', async t => {
  try {
    const currentUrl = '/create-storage-document/add-storage-facility-details';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      facilityName: 'Hank Marvin',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: '',
      facilityPostcode: 'SE11EA',
      facilityStorage: 'Chilled',
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'storageFacilities-facilityTownCity': 'Enter the town or city'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/add-storage-facility-details with missing building and street field validates as error', async t => {
  try {
    const currentUrl = '/create-storage-document/add-storage-facility-details';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      facilityName: 'Hank Marvin',
      facilityAddressOne: '',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: '',
      facilityPostcode: 'SE11EA',
      facilityStorage: 'Chilled',
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'storageFacilities-facilityAddressOne': 'Enter the building and street (address line 1 of 2)',
      'storageFacilities-facilityTownCity': 'Enter the town or city'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/add-storage-facility-details with missing Stored As fields validates as error', async t => {
  try {
    const currentUrl = '/create-storage-document/add-storage-facility-details';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      facilityName: 'Hank Marvin',
      facilityAddressOne: 'Fish Quay',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: 'Seaham',
      facilityPostcode: 'SE11EA',
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'storageFacilities-facilityStorage': 'Select how the products are stored'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('/create-storage-document/add-storage-facility-details with whitespace facilityName, facilityAddressOne and facilityTownCity validates as error', async t => {
  try {
    const currentUrl = '/create-storage-document/add-storage-facility-details';
    const handler = StorageNotes[currentUrl];

    const data = {
      catches: [
        {
          weightOnCC: '2222',
          product: 'Atlantix',
          commodityCode: '34234324',
          certificateNumber: 'CC-11111',
          productWeight: '1111',
          dateOfUnloading: '29/01/2019',
          placeOfUnloading: 'Dover',
          transportUnloadedFrom: 'TRANS-IN-001'
        }
      ],
      facilityName: ' ',
      facilityAddressOne: ' ',
      facilityAddressTwo: 'Fishy Way',
      facilityTownCity: ' ',
      facilityPostcode: 'SE11EA',
      facilityStorage: 'Chilled',
      addAnotherProduct: 'notset'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'storageFacilities-facilityName': 'Enter the facility name',
      'storageFacilities-facilityAddressOne': 'Enter the building and street (address line 1 of 2)',
      'storageFacilities-facilityTownCity': 'Enter the town or city'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
    t.end();
  } catch (e) {
    t.end(e);
  }
});
