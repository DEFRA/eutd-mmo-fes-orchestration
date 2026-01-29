import * as test from 'tape';
import { toFrontEndTransport, toBackEndTransport } from '../../src/persistence/schema/frontEndModels/catchCertificateTransport';
import * as BackEndModels from '../../src/persistence/schema/catchCert';

test('CatchCertificateTransport toFrontEndTransport - should transform containerIdentificationNumber string to containerNumbers array for truck', (t) => {
  const backEndTransport: BackEndModels.CatchCertificateTruck = {
    id: 1,
    vehicle: 'truck',
    nationalityOfVehicle: 'United Kingdom',
    registrationNumber: 'ABC123',
    containerIdentificationNumber: 'CONT001 CONT002 CONT003',
    departurePlace: 'Dover',
    cmr: false
  };

  const result = toFrontEndTransport(backEndTransport);

  t.deepEqual(result.containerNumbers, ['CONT001', 'CONT002', 'CONT003']);
  t.equal(result.containerIdentificationNumber, 'CONT001 CONT002 CONT003');
  t.end();
});

test('CatchCertificateTransport toFrontEndTransport - should handle single containerIdentificationNumber value', (t) => {
  const backEndTransport: BackEndModels.CatchCertificateTruck = {
    id: 1,
    vehicle: 'truck',
    nationalityOfVehicle: 'United Kingdom',
    registrationNumber: 'ABC123',
    containerIdentificationNumber: 'CONT001',
    departurePlace: 'Dover',
    cmr: false
  };

  const result = toFrontEndTransport(backEndTransport);

  t.deepEqual(result.containerNumbers, ['CONT001']);
  t.end();
});

test('CatchCertificateTransport toFrontEndTransport - should filter out empty strings when splitting containerIdentificationNumber', (t) => {
  const backEndTransport: BackEndModels.CatchCertificateTruck = {
    id: 1,
    vehicle: 'truck',
    nationalityOfVehicle: 'United Kingdom',
    registrationNumber: 'ABC123',
    containerIdentificationNumber: 'CONT001  CONT002   CONT003',
    departurePlace: 'Dover',
    cmr: false
  };

  const result = toFrontEndTransport(backEndTransport);

  t.deepEqual(result.containerNumbers, ['CONT001', 'CONT002', 'CONT003']);
  t.end();
});

test('CatchCertificateTransport toFrontEndTransport - should handle empty containerIdentificationNumber', (t) => {
  const backEndTransport: BackEndModels.CatchCertificateTruck = {
    id: 1,
    vehicle: 'truck',
    nationalityOfVehicle: 'United Kingdom',
    registrationNumber: 'ABC123',
    containerIdentificationNumber: '',
    departurePlace: 'Dover',
    cmr: false
  };

  const result = toFrontEndTransport(backEndTransport);

  t.equal(result.containerNumbers, undefined);
  t.end();
});

test('CatchCertificateTransport toFrontEndTransport - should handle null containerIdentificationNumber', (t) => {
  const backEndTransport: BackEndModels.CatchCertificateTruck = {
    id: 1,
    vehicle: 'truck',
    nationalityOfVehicle: 'United Kingdom',
    registrationNumber: 'ABC123',
    containerIdentificationNumber: null,
    departurePlace: 'Dover',
    cmr: false
  };

  const result = toFrontEndTransport(backEndTransport);

  t.equal(result.containerNumbers, undefined);
  t.end();
});

test('CatchCertificateTransport toFrontEndTransport - should handle maximum 10 container numbers', (t) => {
  const backEndTransport: BackEndModels.CatchCertificateTruck = {
    id: 1,
    vehicle: 'truck',
    nationalityOfVehicle: 'United Kingdom',
    registrationNumber: 'ABC123',
    containerIdentificationNumber: 'C1 C2 C3 C4 C5 C6 C7 C8 C9 C10',
    departurePlace: 'Dover',
    cmr: false
  };

  const result = toFrontEndTransport(backEndTransport);

  t.deepEqual(result.containerNumbers, ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
  t.equal(result.containerNumbers?.length, 10);
  t.end();
});

test('CatchCertificateTransport toFrontEndTransport - should not set containerNumbers when cmr is true', (t) => {
  const backEndTransport: BackEndModels.CatchCertificateTruck = {
    id: 1,
    vehicle: 'truck',
    containerIdentificationNumber: 'CONT001 CONT002',
    cmr: true
  };

  const result = toFrontEndTransport(backEndTransport);

  t.equal(result.containerNumbers, undefined);
  t.equal(result.containerIdentificationNumber, undefined);
  t.end();
});

test('CatchCertificateTransport toFrontEndTransport - should not include containerNumbers for plane vehicle', (t) => {
  const backEndTransport: BackEndModels.CatchCertificatePlane = {
    id: 1,
    vehicle: 'plane',
    flightNumber: 'FL123',
    containerNumber: 'CONT123',
    departurePlace: 'Heathrow'
  };

  const result = toFrontEndTransport(backEndTransport);

  t.equal(result.containerNumbers, undefined);
  t.end();
});

test('CatchCertificateTransport toBackEndTransport - should preserve containerIdentificationNumber for truck when transforming to backend', (t) => {
  const frontEndTransport = {
    id: '1',
    vehicle: 'truck',
    nationalityOfVehicle: 'United Kingdom',
    registrationNumber: 'ABC123',
    containerIdentificationNumber: 'CONT001 CONT002 CONT003',
    containerNumbers: ['CONT001', 'CONT002', 'CONT003'],
    departurePlace: 'Dover'
  };

  const result = toBackEndTransport(frontEndTransport);

  t.equal(result.containerIdentificationNumber, 'CONT001 CONT002 CONT003');
  t.equal((result as any).containerNumbers, undefined);
  t.end();
});

test('CatchCertificateTransport toBackEndTransport - should handle truck transport with cmr=true', (t) => {
  const frontEndTransport = {
    id: '1',
    vehicle: 'truck',
    cmr: 'true',
    containerIdentificationNumber: 'CONT001 CONT002',
    containerNumbers: ['CONT001', 'CONT002']
  };

  const result = toBackEndTransport(frontEndTransport);

  t.equal(result.containerIdentificationNumber, undefined);
  t.equal((result as any).containerNumbers, undefined);
  t.end();
});
