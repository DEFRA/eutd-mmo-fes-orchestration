import ApplicationConfig from "../applicationConfig";
import {CatchCertModel} from "../persistence/schema/catchCert";
import logger from "../logger";
import {StorageDocumentModel} from "../persistence/schema/storageDoc";
import {ProcessingStatementModel} from "../persistence/schema/processingStatement";
import { constructOwnerQuery } from "../persistence/services/catchCert";


export const userCanCreateDraft = async (userId: string, documentType: string, contactId: string) : Promise<boolean> => {
  const query = {
    $or: constructOwnerQuery(userId, contactId),
    status: 'DRAFT'
  };

  let result;
  let numberOfDraftCertificates;

  switch(documentType) {
    case "catchCertificate":
      numberOfDraftCertificates = await CatchCertModel.find(query).limit(ApplicationConfig._maximumConcurrentDrafts).countDocuments();
      result = numberOfDraftCertificates < ApplicationConfig._maximumConcurrentDrafts;
      break;
    case "storageDocument":
    case "storageNotes":
      numberOfDraftCertificates = await StorageDocumentModel.find(query).limit(ApplicationConfig._maximumConcurrentDrafts).countDocuments();
      result = numberOfDraftCertificates < ApplicationConfig._maximumConcurrentDrafts;
      break;
    case "processingStatement":
      numberOfDraftCertificates = await ProcessingStatementModel.find(query).limit(ApplicationConfig._maximumConcurrentDrafts).countDocuments();
      result = numberOfDraftCertificates < ApplicationConfig._maximumConcurrentDrafts;
      break;

  }

  logger.info(`[ORCHESTRATOR][CHECKING-USER-CAN-CREATE-DRAFT][${result}]`);
  return result
};
