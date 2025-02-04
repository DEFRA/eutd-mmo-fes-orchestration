import * as CCService from '../persistence/services/catchCert';
import * as SDService from '../persistence/services/storageDoc';
import * as PSService from '../persistence/services/processingStatement';
import DocumentNumberService from '../services/documentNumber.service';
import ServiceNames from '../validators/interfaces/service.name.enum';
import { CatchCertificate } from '../persistence/schema/catchCert';
import { ProcessingStatement } from '../persistence/schema/processingStatement';
import { StorageDocument } from '../persistence/schema/storageDoc';

export default class UserReferenceController {

  static readonly getService = (name: ServiceNames) => {
    switch(name) {
      case ServiceNames.CC: return CCService;
      case ServiceNames.PS: return PSService;
      case ServiceNames.SD: return SDService;
    }
  }

  static readonly getUserReference = async (document: CatchCertificate | ProcessingStatement | StorageDocument): Promise<string> =>
    document ? document.userReference : null;

  static readonly addUserReference = async (userPrincipal: string, documentNumber: string, userReference: string, contactId: string): Promise<void> => {
    const serviceName = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);

    if (serviceName === ServiceNames.UNKNOWN) {
      return null;
    }

    await UserReferenceController.getService(serviceName).upsertUserReference(userPrincipal, documentNumber, userReference, contactId);
  }
}