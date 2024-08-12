import { SessionStoreFactory } from '../../src/session_store/factory';
import DocumentNumberService from '../../src/services/documentNumber.service';
import ServiceNames from '../../src/validators/interfaces/service.name.enum';

import * as test from 'tape';

const USER_ID = 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12';

test('#documentNumberService.getDocumentNumber', (t) => {
  // generates a unique document reference number which is stored against the generated catch certificate, storage note etc
  const year = new Date().getUTCFullYear();
  const doc1 = DocumentNumberService.getDocumentNumber(ServiceNames.CC);
  t.ok( doc1.match(new RegExp(`^GBR-${year}-CC-[A-F0-9]{9}$` )),'document number formatted correctly' );
  const doc2 = DocumentNumberService.getDocumentNumber(ServiceNames.CC);
  t.notEqual( doc1, doc2, "document random");
  t.end();

});

test('DocumentNumberService.createDocumentNumber', async (t) => {
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  const key = 'catchCertificate/documentNumber';
  const document = await DocumentNumberService.createDocumentNumber(USER_ID, ServiceNames.CC, key, 'catchCertificate');
  const result = document.documentNumber.length > 0;

  t.equal(true, result);
  t.end();
});

test('DocumentNumberService.getDocument', async (t) => {

  const key = 'catchCertificate/documentNumber';
  const sessionStore = await SessionStoreFactory.getSessionStore({});
  const documentToStore = {
    documentNumber : DocumentNumberService.getDocumentNumber(ServiceNames.CC)
  };
  const payload = {...documentToStore} as any;
  await sessionStore.writeAllFor(USER_ID, key, payload);

  const document = await DocumentNumberService.getDraftDocuments(USER_ID, key);

  t.equal(documentToStore.documentNumber, document.documentNumber);
  t.end();
});