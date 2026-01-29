import * as test from 'tape';
import * as Hapi from "@hapi/hapi";
const sinon = require('sinon');
import CatchCertificateTransportController from "../../src/controllers/catch-certificate-transport.controller";
import Service from "../../src/services/catch-certificate-transport.service";

const userPrincipal = 'test-user';
const documentNumber = 'GBR-2024-CC-TEST123';
const contactId = 'contact-123';

test('CatchCertificateTransportController.updateTransport - should transform containerNumbers array to containerIdentificationNumber string for truck', async (t) => {
  try {
    const mockRequest = {
      payload: {
        id: '1',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['CONT001', 'CONT002', 'CONT003'],
        departurePlace: 'Dover'
      }
    };

    const updateTransportStub = sinon.stub(Service, 'updateTransport').resolves({
      id: 1,
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: 'CONT001 CONT002 CONT003',
      departurePlace: 'Dover'
    });

    await CatchCertificateTransportController.updateTransport(mockRequest as any, userPrincipal, documentNumber, contactId);

    const callArgs = updateTransportStub.getCall(0).args[0];
    t.equal(callArgs.id, '1');
    t.equal(callArgs.vehicle, 'truck');
    t.equal(callArgs.containerIdentificationNumber, 'CONT001 CONT002 CONT003');

    updateTransportStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchCertificateTransportController.updateTransport - should filter out empty strings from containerNumbers array', async (t) => {
  try {
    const mockRequest = {
      payload: {
        id: '1',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['CONT001', '', 'CONT003', '  ', 'CONT004'],
        departurePlace: 'Dover'
      }
    };

    const updateTransportStub = sinon.stub(Service, 'updateTransport').resolves({});

    await CatchCertificateTransportController.updateTransport(mockRequest as any, userPrincipal, documentNumber, contactId);

    const callArgs = updateTransportStub.getCall(0).args[0];
    t.equal(callArgs.containerIdentificationNumber, 'CONT001 CONT003 CONT004');

    updateTransportStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchCertificateTransportController.updateTransport - should handle empty containerNumbers array', async (t) => {
  try {
    const mockRequest = {
      payload: {
        id: '1',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: [],
        departurePlace: 'Dover'
      }
    };

    const updateTransportStub = sinon.stub(Service, 'updateTransport').resolves({});

    await CatchCertificateTransportController.updateTransport(mockRequest as any, userPrincipal, documentNumber, contactId);

    const callArgs = updateTransportStub.getCall(0).args[0];
    t.equal(callArgs.containerIdentificationNumber, '');

    updateTransportStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchCertificateTransportController.updateTransport - should handle containerNumbers array with all empty strings', async (t) => {
  try {
    const mockRequest = {
      payload: {
        id: '1',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['', '  ', '   '],
        departurePlace: 'Dover'
      }
    };

    const updateTransportStub = sinon.stub(Service, 'updateTransport').resolves({});

    await CatchCertificateTransportController.updateTransport(mockRequest as any, userPrincipal, documentNumber, contactId);

    const callArgs = updateTransportStub.getCall(0).args[0];
    t.equal(callArgs.containerIdentificationNumber, '');

    updateTransportStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchCertificateTransportController.updateTransport - should not transform containerNumbers for plane vehicle', async (t) => {
  try {
    const mockRequest = {
      payload: {
        id: '1',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT123',
        containerNumbers: ['CONT001', 'CONT002'],
        departurePlace: 'Heathrow'
      }
    };

    const updateTransportStub = sinon.stub(Service, 'updateTransport').resolves({});

    await CatchCertificateTransportController.updateTransport(mockRequest as any, userPrincipal, documentNumber, contactId);

    const callArgs = updateTransportStub.getCall(0).args[0];
    t.equal(callArgs.vehicle, 'plane');
    t.equal(callArgs.containerIdentificationNumber, undefined);

    updateTransportStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchCertificateTransportController.updateTransport - should handle maximum 10 container items', async (t) => {
  try {
    const mockRequest = {
      payload: {
        id: '1',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
        departurePlace: 'Dover'
      }
    };

    const updateTransportStub = sinon.stub(Service, 'updateTransport').resolves({});

    await CatchCertificateTransportController.updateTransport(mockRequest as any, userPrincipal, documentNumber, contactId);

    const callArgs = updateTransportStub.getCall(0).args[0];
    t.equal(callArgs.containerIdentificationNumber, 'C1 C2 C3 C4 C5 C6 C7 C8 C9 C10');

    updateTransportStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});

test('CatchCertificateTransportController.updateTransport - should trim whitespace from containerNumbers before joining', async (t) => {
  try {
    const mockRequest = {
      payload: {
        id: '1',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['  CONT001  ', '  CONT002  ', '  CONT003  '],
        departurePlace: 'Dover'
      }
    };

    const updateTransportStub = sinon.stub(Service, 'updateTransport').resolves({});

    await CatchCertificateTransportController.updateTransport(mockRequest as any, userPrincipal, documentNumber, contactId);

    const callArgs = updateTransportStub.getCall(0).args[0];
    t.equal(callArgs.containerIdentificationNumber, 'CONT001 CONT002 CONT003');

    updateTransportStub.restore();
    t.end();
  } catch (e) {
    t.end(e);
  }
});
