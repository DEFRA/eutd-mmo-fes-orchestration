import * as test from 'tape';
import logger from '../../../src/logger';

import ProcessingStatement from '../../../src/services/handlers/processing-statement';

// Handler route keys all use the :documentNumber pattern
const DN = ':documentNumber';

//------ TESTS FOR add-consignment-details -----
test('/create-processing-statement/add-consignment-details with all mandatory fields validates as OK', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-consignment-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: 'A description'
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
    t.equals(Object.keys(errors).length, 0, 'no validation errors are returned');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-consignment-details with missing consignmentDescription validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-consignment-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [{}],
      healthCertificateNumber: 'HN-111111',
      healthCertificateDate: '31/03/2018'
    };

    let { errors } = await handler({
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
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-consignment-details with whitespace consignmentDescription validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-consignment-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: ' ',
    };

    let { errors } = await handler({
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
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

//------ TESTS FOR add-catch-weights (replaces old add-catch-to-consignment which no longer exists) -----
test('/create-processing-statement/add-catch-weights with all weight fields valid validates as OK', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'non_uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
    t.equals(Object.keys(errors).length, 0, 'no validation errors are returned');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-weights with missing totalWeightLanded validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'non_uk',
          exportWeightBeforeProcessing: '1111',
          exportWeightAfterProcessing: '1110'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    const expected = {
      'catches-0-totalWeightLanded': 'psAddCatchWeightsErrorEnterTotalWeightLandedInKG'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-weights with zero totalWeightLanded validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    // exportWeight values must also be 0 so they do not trigger the
    // "exceeds totalWeight" cross-field error alongside the zero-weight error
    const data = {
      catches: [
        {
          catchCertificateType: 'non_uk',
          totalWeightLanded: '0',
          exportWeightBeforeProcessing: '0',
          exportWeightAfterProcessing: '0'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    t.true(errors);
    t.ok(errors['catches-0-totalWeightLanded'], 'totalWeightLanded error is set');
    t.equals(errors['catches-0-totalWeightLanded'], 'psAddCatchWeightsErrorTotalWeightGreaterThanNull', 'totalWeightLanded zero error message is correct');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-weights with missing exportWeightBeforeProcessing validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'non_uk',
          totalWeightLanded: '1112',
          exportWeightAfterProcessing: '1110'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    const expected = {
      'catches-0-exportWeightBeforeProcessing': 'psAddCatchWeightsErrorEnterExportWeightInKGBeforeProcessing'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-weights with missing exportWeightAfterProcessing validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'non_uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '1111'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    const expected = {
      'catches-0-exportWeightAfterProcessing': 'psAddCatchWeightsErrorEnterExportWeightInKGAfterProcessing'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-weights with negative exportWeightBeforeProcessing and exportWeightAfterProcessing validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'non_uk',
          totalWeightLanded: '1112',
          exportWeightBeforeProcessing: '-1111',
          exportWeightAfterProcessing: '-1110'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    const expected = {
      'catches-0-exportWeightBeforeProcessing': 'psAddCatchWeightsErrorExportWeightGreaterThanNullBeforeProcessing',
      'catches-0-exportWeightAfterProcessing': 'psAddCatchWeightsErrorExportWeightGreaterThanNullAfterProcessing'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-weights with exportWeightAfterProcessing exceeding exportWeightBeforeProcessing validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'non_uk',
          totalWeightLanded: '2000',
          exportWeightBeforeProcessing: '500',
          exportWeightAfterProcessing: '1000'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    const expected = {
      'catches-0-exportWeightAfterProcessing': 'psAddCatchWeightsErrorExportWeightAfterProcessingExceedsBeforeProcessing'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-catch-weights - uk type skips totalWeightLanded validation', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-catch-weights/:catchIndex`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [
        {
          catchCertificateType: 'uk',
          exportWeightBeforeProcessing: '500',
          exportWeightAfterProcessing: '400'
        }
      ]
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: { catchIndex: 0 },
      errors: {}
    });

    t.equals(errors['catches-0-totalWeightLanded'], undefined, 'totalWeightLanded not validated for uk catch type');
    t.equals(Object.keys(errors).length, 0, 'no errors for uk catch with valid weights');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

//------ TESTS FOR catch-added -----
test('/create-processing-statement/catch-added with missing addAnotherCatch validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/catch-added`;
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

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      addAnotherCatch: 'ccLandingTypeSelectOption'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/catch-added with empty addAnotherCatch validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/catch-added`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [{}],
      consignmentDescription: 'Consignment 1',
      addAnotherCatch: ''
    };

    let { errors } = await handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      addAnotherCatch: 'ccLandingTypeSelectOption'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

//------ TESTS FOR add-processing-plant-details -----
test('/create-processing-statement/add-processing-plant-details with all mandatory fields validates as OK', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      healthCertificateNumber: 'HC-111111',
      healthCertificateDate: '31/03/2018',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Approval123',
      plantName: 'Triffid',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
    t.equals(Object.keys(errors).length, 0, 'no validation errors are returned');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing personResponsibleForConsignment validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      dateOfAcceptance: '03/03/2019',
      plantApprovalNumber: 'Approval123',
      plantName: 'Triffid',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment: 'psAddProcessingPDErrorPersonResponsibleForConsignment'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with whitespace personResponsibleForConsignment validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: ' ',
      plantApprovalNumber: 'Approval123',
      plantName: 'Triffid',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment: 'psAddProcessingPDErrorPersonResponsibleForConsignment'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing plantApprovalNumber validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantName: 'Triffid',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantApprovalNumber: 'psAddProcessingPDErrorPlantApprovalNumber'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with whitespace personResponsibleForConsignment and plantApprovalNumber validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: ' ',
      plantApprovalNumber: ' ',
      plantName: 'Triffid',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment: 'psAddProcessingPDErrorPersonResponsibleForConsignment',
      plantApprovalNumber: 'psAddProcessingPDErrorPlantApprovalNumber',
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with missing plantName validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Approval123',
    };

    let { errors } = handler({
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
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with emoji in plantName validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank',
      plantApprovalNumber: 'Approval123',
      plantName: '🐟 Triffid Plant',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantName: 'emojiCharactersNotPermitted'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-details with emoji in personResponsibleForConsignment validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-details`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      catches: [],
      consignmentDescription: 'Consignment 1',
      dateOfAcceptance: '03/03/2019',
      personResponsibleForConsignment: 'Hank 😀',
      plantApprovalNumber: 'Approval123',
      plantName: 'Triffid Plant',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      personResponsibleForConsignment: 'emojiCharactersNotPermitted'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

//------ TESTS FOR add-processing-plant-address -----
test('/create-processing-statement/add-processing-plant-address with all address fields missing validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-address`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      plantName: 'Triffid',
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantAddressOne: 'psAddProcessingPlantAddressErrorAddress'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-address with empty plantAddressOne validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-address`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      plantName: 'Triffid',
      plantAddressOne: '',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let { errors } = handler({
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
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-address with missing plantTownCity validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-address`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: '',
      plantPostcode: 'SE11EA'
    };

    let { errors } = handler({
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
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-address with whitespace plantPostcode validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-address`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      plantName: 'Triffid',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: ' '
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantPostcode: 'Enter the postcode'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-address with emoji in plantAddressOne validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-address`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      plantName: 'Triffid Plant',
      plantAddressOne: '🏠 Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantAddressOne: 'emojiCharactersNotPermitted'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-address with emoji in plantTownCity validates as error', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-address`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      plantName: 'Triffid Plant',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: '🌊 Seaham',
      plantPostcode: 'SE11EA'
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    const expected = {
      plantTownCity: 'emojiCharactersNotPermitted'
    };
    t.true(errors);
    t.deepEquals(errors, expected);
    t.equals(Object.keys(errors).length, Object.keys(expected).length, 'error count matches expected');
    t.deepEquals(Object.keys(errors).sort(), Object.keys(expected).sort(), 'error keys match expected');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});

test('/create-processing-statement/add-processing-plant-address with valid address validates as OK', async t => {
  try {
    const currentUrl = `/create-processing-statement/${DN}/add-processing-plant-address`;
    const handler = ProcessingStatement[currentUrl];

    const data = {
      plantName: 'Triffid Plant',
      plantAddressOne: 'Fish Quay',
      plantAddressTwo: 'Fishy Way',
      plantTownCity: 'Seaham',
      plantPostcode: 'SE11EA'
    };

    let { errors } = handler({
      data: data,
      nextUrl: '',
      currentUrl: currentUrl,
      params: 0,
      errors: {}
    });

    t.true(errors);
    t.deepEquals(errors, {});
    t.equals(Object.keys(errors).length, 0, 'no validation errors are returned');
  } catch (e) {
    logger.error(e);
  }
  t.end();
});
