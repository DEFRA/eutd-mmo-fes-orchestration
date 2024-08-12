import * as test from 'tape';
import * as hapi from 'hapi';
import { mock } from 'ts-mockito';
const sinon = require('sinon');
import ManageCertsService from "../../src/services/manage-certs.service";
import Controller from '../../src/controllers/manage-certs.controller';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

const deleteDraftCertificate = (description, deleteDocument, throwError = false, nonJs = false) =>
  test(`MangeCertsController.deleteDraftCertificate - ${description}`, async (t) => {
    try {
      let manageCertStub;
      if (throwError) {
        manageCertStub = sinon.stub(ManageCertsService, 'deleteDraftCertificate').rejects(new Error('a'));
      } else {
         manageCertStub = sinon.stub(ManageCertsService, 'deleteDraftCertificate').resolves();
      }
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.headers = nonJs ? { accept: 'text/html' } : {};
      mockReq.payload = {
        previousUri: 'previousUri',
        documentDelete: deleteDocument,
        nextUri: 'nextUri',
        documentNumber: '001'
      };
      const mockRes = nonJs ? { redirect: sinon.fake() } : sinon.fake();
      await Controller.deleteDraftCertificate(mockReq, mockRes);
      
      if (throwError) {
        t.assert(nonJs ? !mockRes.redirect.called : !mockRes.called);
      } else {
        if (deleteDocument === 'Yes') {
          t.assert(manageCertStub.called);
          t.deepEquals(manageCertStub.getCall(0).args, ['001']);
        } else {
          t.assert(!manageCertStub.called);
        }
        
        t.assert(nonJs ? mockRes.redirect.called : mockRes.called);
      }
      
      manageCertStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });

  const voidCertificate = (description, voidDocument, throwError = false, nonJs = false) =>
  test(`MangeCertsController.voidCertificate - ${description}`, async (t) => {
    try {
      let manageCertStub;
      if (throwError) {
        manageCertStub = sinon.stub(ManageCertsService, 'voidCertificate').rejects(new Error('a'));
      } else {
         manageCertStub = sinon.stub(ManageCertsService, 'voidCertificate').resolves();
      }
      const mockReq = mock(hapi.Request);
      mockReq.app = {
        claims: {
          sub: USER_ID
        }
      };
      mockReq.headers = nonJs ? { accept: 'text/html' } : {};
      mockReq.payload = {
        previousUri: 'previousUri',
        voidDocument: voidDocument,
        nextUri: 'nextUri',
        documentNumber: '001'
      };
      const mockRes = nonJs ? { redirect: sinon.fake() } : sinon.fake();
      await Controller.voidCertificate(mockReq, mockRes);
      
      if (throwError) {
        t.assert(nonJs ? !mockRes.redirect.called : !mockRes.called);
      } else {
        if (voidDocument === 'Yes') {
          t.assert(manageCertStub.called);
          t.deepEquals(manageCertStub.getCall(0).args, ['001']);
        } else {
          t.assert(!manageCertStub.called);
        }
        
        t.assert(nonJs ? mockRes.redirect.called : mockRes.called);
      }
      
      manageCertStub.restore();
      t.end();
    } catch (e) {
      t.end(e);
    }
  });
  
//deleteCertificateTest('Should call service.delete if documentDelete === yes', 'Yes');
//deleteCertificateTest('Should catch an error', 'Yes', true);
//deleteCertificateTest('Should not call service.delete', 'No', false, true);