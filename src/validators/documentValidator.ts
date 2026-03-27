import { isEmpty } from "lodash";
import * as CatchCertSchema from "../persistence/schema/catchCert";
import * as ProcessingStatementSchema from "../persistence/schema/processingStatement";
import * as StorageDocSchema from "../persistence/schema/storageDoc";
import { BaseModel } from "../persistence/schema/base";
import { IDraft, IProductDraft } from "../persistence/schema/common";
import { CatchCertificateDraft } from "../persistence/schema/frontEndModels/catchCertificate";
import { getDraftCache, saveDraftCache } from "../persistence/services/catchCert";
import DocumentNumberService from "../services/documentNumber.service";
import ServiceNames from "./interfaces/service.name.enum";

export const validateCompletedDocument = async (documentNumber: string, userPrincipal: string, contactId: string, foreignDocumentNumber: string): Promise<boolean> => {
  const draftCache: CatchCertSchema.CatchCertificate | CatchCertificateDraft[] | IDraft = await getDraftCache(userPrincipal, contactId, foreignDocumentNumber);

  if (!isEmpty(draftCache?.[documentNumber])) return true;

  const isProcessingStatement: boolean = DocumentNumberService.getServiceNameFromDocumentNumber(foreignDocumentNumber) === ServiceNames.PS;
  const completedDocument: CatchCertSchema.CatchCertificateModel | ProcessingStatementSchema.IProcessingStatementModel | StorageDocSchema.StorageDocumentModel = isProcessingStatement ? await CatchCertSchema.CatchCertModel.findOne({
    status: {
      $in: [
        CatchCertSchema.DocumentStatuses.Complete,
      ],
    },
    documentNumber: documentNumber,
  }).lean() : await BaseModel.findOne({
    status: {
      $in: [
        CatchCertSchema.DocumentStatuses.Complete,
      ],
    },
    documentNumber: documentNumber,
  }).lean();

  if (!completedDocument) return false;

  let products: IProductDraft[];
  const service = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);
  switch (service) {
    case ServiceNames.CC: {
      const productsArray: CatchCertSchema.Product[] = (completedDocument as CatchCertSchema.CatchCertificateModel).exportData?.products;
      products = getProductsCatchCertificate(productsArray);
      break;
    }
    case ServiceNames.PS: {
      const ctchArray: ProcessingStatementSchema.Catch[] = (completedDocument as ProcessingStatementSchema.IProcessingStatementModel).exportData?.catches;
      products = getProductsProcessingStatement(ctchArray);
      break;
    }
    case ServiceNames.SD: {
      const ctchArray: StorageDocSchema.Catch[] = (completedDocument as StorageDocSchema.StorageDocumentModel).exportData?.catches;
      products = getProductsStorageDocument(ctchArray);
      break;
    }
  }

  const cachedData: IDraft  = {
    ...draftCache as IDraft,
    [documentNumber]: {
      products
    }
  };

  await saveDraftCache(userPrincipal, contactId, foreignDocumentNumber, cachedData);

  return true;
}

const getProductsProcessingStatement = (ctchArray: ProcessingStatementSchema.Catch[]) => Array.isArray(ctchArray) ? ctchArray?.reduce((productDrafts: IProductDraft[], ctch: ProcessingStatementSchema.Catch) =>
  [...productDrafts, {
    species: ctch.species,
    speciesCode: ctch.speciesCode
  }]
, []) : [];

const getProductsStorageDocument = (ctchArray: ProcessingStatementSchema.Catch[]) => Array.isArray(ctchArray) ? ctchArray?.reduce((productDrafts: IProductDraft[], ctch: StorageDocSchema.Catch) =>
  [...productDrafts, {
    species: ctch.product
  }], []) : []

export const getProductsCatchCertificate = (productsArray: CatchCertSchema.Product[]) => Array.isArray(productsArray) ? productsArray?.reduce((productDrafts: IProductDraft[], product: CatchCertSchema.Product) => {
    const index = productDrafts.findIndex((addedProduct: IProductDraft) => addedProduct.species === product.species || (!isEmpty(product.speciesCode) && addedProduct.speciesCode === product.speciesCode));
    if (index >= 0) {
      productDrafts[index].totalWeight += product.caughtBy.reduce((totalLandingWeight: number, landing: CatchCertSchema.Catch) => isNaN(landing.weight) ? totalLandingWeight : totalLandingWeight + landing.weight, 0);
      return productDrafts;
    }
    return [...productDrafts, {
      species: product.species,
      speciesCode: product.speciesCode,
      totalWeight: product.caughtBy.reduce((totalLandingWeight: number, landing: CatchCertSchema.Catch) => isNaN(landing.weight) ? totalLandingWeight : totalLandingWeight + landing.weight, 0)
    }]
  }, []) : []

export const validateSpecies = async (documentNumber: string, species: string, speciesCode: string, userPrincipal: string, contactId: string, foreignDocumentNumber: string): Promise<boolean> => {
  const draftCache: CatchCertSchema.CatchCertificate | CatchCertificateDraft[] | IDraft = await getDraftCache(userPrincipal, contactId, foreignDocumentNumber);

  if (isEmpty(draftCache?.[documentNumber]))
    return false;

  return draftCache?.[documentNumber]?.products.some(
    (product: IProductDraft) => product.species === species || (!isEmpty(product.speciesCode) && product.speciesCode === speciesCode)
  );
}