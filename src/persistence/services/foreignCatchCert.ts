import logger from '../../logger';
import { STATUS_COMPLETE }  from '../../services/constants';
import * as _ from 'lodash';
import { IForeignCatchCert } from '../schema/foreignCatchCert';
import { StorageDocumentModel } from '../schema/storageDoc';
import { ProcessingStatementModel } from '../schema/processingStatement';

interface FlattenedCatches {
	documentNumber: string;
  createdAt: any;
  species: string;
  weight: number;
}

const unwindDocument = (documents: any[]): FlattenedCatches[] => {

  const ret = []

  for (const doc of _.sortBy(documents, 'createdAt')) {

      for (const cat of doc.exportData.catches) {
        const item: any = {
          documentNumber: doc.documentNumber,
          createdAt: doc.createdAt
        }

        if (doc.__t == "storageDocument") {
          item.certificateNumber = cat.certificateNumber;
          item.species = cat.product;
          item.id = cat.id;
          item.weight = parseInt(cat.productWeight, 10);
          item.weightOnCC = cat.weightOnCC ? parseInt(cat.weightOnCC, 10) : 0;
        }

        if (doc.__t == "processingStatement") {
          item.certificateNumber = cat.catchCertificateNumber;
          item.species = cat.species;
          item.id = cat.id;
          item.weight = parseInt(cat.exportWeightBeforeProcessing, 10);
          item.weightOnCC = parseInt(cat.totalWeightLanded, 10);
        }

        ret.push(item)
      }
  }

  return ret;
}

const getDocuments = async (certNumbers: string[]) => {

  const documents = [];

  const storageDocuments = await StorageDocumentModel.find({
    __t: "storageDocument",
    "exportData.catches.certificateNumber": {$in: certNumbers}
  });

  for (const doc of storageDocuments) {
    // Use an if statement here rather than a param on the .find so that we include records that don't have a status.
    if ((doc.status === STATUS_COMPLETE) || (!doc.status)) {
      documents.push(doc);
    }
  }

  const processingStatements = await ProcessingStatementModel.find({
    __t: "processingStatement",
    "exportData.catches.catchCertificateNumber": {$in: certNumbers}
  });

  for (const doc of processingStatements) {

    // Use an if statement here rather than a param on the .find so that we include records that don't have a status.
    if ((doc.status === STATUS_COMPLETE) || (!doc.status)) {
      documents.push(doc);
    }
  }

  return documents;

}

export const getWeightTotalsByCatchCert = async (certNumbers: string[]): Promise<IForeignCatchCert[]> => {

  logger.info(`[GET-WEIGHT-TOTALS-BY-CATCH-CERT][CERT-NUMBERS:${certNumbers}]`)

  if (certNumbers.length == 0)
    return [];

  const documents = await getDocuments(certNumbers)

  logger.info(`[GET-WEIGHT-TOTALS-BY-CATCH-CERT][RELATED-DOCUMENTS:${documents.map(_document => _document.documentNumber)}]`)

  const flattened = unwindDocument(documents)

  const grouped = _(flattened)
    .sortBy(['certificateNumber', 'createdAt', 'documentNumber'])
    .groupBy('certificateNumber')
    .map( (v, k) => [k, v] )  // can be done with ... ?
    .value()

  const foreignCatchCerts = []

  for (const [certificateNumber, catches] of grouped){

    const items = {};

    for (const cat of catches as any){

      if (!(cat.species in items)){
        items[cat.species] = {
          species: cat.species,
          createdByDocument: cat.documentNumber,
          totalWeight: cat.weightOnCC,
          allocatedWeight: 0
        }
      }
      items[cat.species].allocatedWeight += cat.weight
    }

    foreignCatchCerts.push({
      certificateNumber: certificateNumber,
      items: Object.values(items)
    })

  }

  return foreignCatchCerts
}

