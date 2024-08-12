import * as test from 'tape';
import logger from '../../../src/logger';

import ProcessingStatement from '../../../src/services/handlers/processing-statement';
import moment = require('moment');

//------ TESTS FOR /create-processing-statement/add-consignment-details -----
test('/create-processing-statement/add-consignment-details with all mandatory fields validates as OK', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-consignment-details';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: 'A description'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-consignment-details with missing consignmentDescription validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-consignment-details';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [{}],
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      consignmentDescription: 'psConsignmentEnterConsignmentDescription'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-consignment-details with whitespace consignmentDescription validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-consignment-details';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: ' ',
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    const expected = {
      consignmentDescription: 'psConsignmentEnterConsignmentDescription'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

//------ TESTS FOR /create-processing-statement/add-catch-to-consignment/:catchIndex -----
test('/create-processing-statement/add-catch-to-consignment/:catchIndex with all mandatory fields validates as OK', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-to-consignment/:catchIndex with missing species validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {'catches-0-species': 'Enter the FAO code or species name'};
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-to-consignment/:catchIndex with missing catchCertificateNumber validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'catches-0-catchCertificateNumber': 'Enter the catch certificate number'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-to-consignment/:catchIndex with missing totalWeightLanded validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'catches-0-totalWeightLanded': 'Enter the total weight landed in kg'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-to-consignment/:catchIndex with missing exportWeightBeforeProcessing validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'catches-0-exportWeightBeforeProcessing':
        'Enter the export weight in kg (before processing)'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-to-consignment/:catchIndex with missing exportWeightAfterProcessing validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'catches-0-exportWeightAfterProcessing':
        'Enter the export weight in kg (after processing)'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-to-consignment/:catchIndex with whitespace species and catchCertificateNumber validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: ' ',
          catchCertificateNumber: ' ',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'catches-0-species': 'Enter the FAO code or species name',
      'catches-0-catchCertificateNumber': 'Enter the catch certificate number'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-to-consignment/:catchIndex with invalid (negative) numbers in totalWeightLanded, exportWeightBeforeProcessing and exportWeightAfterProcessing validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/add-catch-to-consignment';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '-1112',
          exportWeightBeforeProcessing: '-1111',
          exportWeightAfterProcessing: '-1110'
        }
      ],
      consignmentDescription: 'A description',
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      'catches-0-totalWeightLanded':
        'Enter the total landed weight as a whole number, like 500',
      'catches-0-exportWeightBeforeProcessing':
        'Enter the export weight (before processing) as a whole number, like 500',
      'catches-0-exportWeightAfterProcessing':
        'Enter the export weight (after processing) as a whole number, like 500'
    };

    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});


//------ TESTS FOR /create-processing-statement/catch-added -----
test('/create-processing-statement/catch-added with missing addAnotherCatch validates as error', async t => {
  try {
    const currentUrl = '/create-processing-statement/catch-added';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      addAnotherCatch: 'psCatchAddedErrorAddAnotherCatch'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});


//------ TESTS FOR /create-processing-statement/add-processing-plant-details -----
test('/create-processing-statement/add-processing-plant-details with all mandatory fields validates as OK', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-details';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing personResponsibleForConsignment validates as error', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-details';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment:
        'psAddProcessingPlantDetailsErrorNullReponsiblePerson'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing plantApprovalNumber validates as error', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-details';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantApprovalNumber: 'psAddProcessingPlantDetailsErrorNullPlantApprovalNumber'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing plantName validates as error', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-address';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantName: 'psAddProcessingPlantAddressErrorNullPlantName'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing plantAddressOne validates as error', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-address';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantAddressOne: 'Enter the address'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing plantAddressOne validates as error', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-address';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: '',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantAddressOne: 'Enter the building and street (address line 1 of 2)'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing plantTownCity validates as error', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-address';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Marvin',
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: '',
      plantPostcode: 'SE11EA'
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantTownCity: 'Enter the town or city'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with whitespace personResponsibleForConsignment, plantApprovalNumber validates as error', async t => {
  try {
    const currentUrl =
      '/create-processing-statement/add-processing-plant-details';
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          species: 'Atlantic Cod',
          catchCertificateNumber: 'CT-111111',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      addAnotherCatch: 'notset',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: ' ',
      plantApprovalNumber: ' ',
    };

    let {errors} = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment:
        'psAddProcessingPlantDetailsErrorNullReponsiblePerson',
      plantApprovalNumber: 'psAddProcessingPlantDetailsErrorNullPlantApprovalNumber',
    };
    t.true(errors);
    t.deepEquals(errors, expected);
  } catch (e) {
    logger.error(e);
  }
  t.end();
});
