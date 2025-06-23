import * as BackEndModels from '../../schema/catchCert';
import { IExportCertificateResults } from '../exportCertificateResults';
import { CcExporter } from './exporterDetails';
import { Conservation } from './conservation';
import { CatchCertificateTransport } from './catchCertificateTransport';
import { ExportLocation } from './export-location';
import { ProgressStatus, Transport } from '../../../persistence/schema/common';
import { CatchCertificateProgress } from './catchCertificate';
import { ProcessingStatementProgress } from './processingStatement';
import { StorageDocumentProgress } from './storageDocument';

interface CodeAndLabel {
  code: string;
  label: string;
  admin?: string;
}

type Presentation = CodeAndLabel;
type State = CodeAndLabel;
type Species = CodeAndLabel;
//This was added to get all the details from the Back-end to the front-end

export interface Vessel {
  pln: string; // Port Letter and Number
  vesselName: string;
  homePort?: string;
  flag?: string; // jurisdiction under whose laws the vessel is registered or licensed
  cfr?: string, // cost and freight (CFR) is a legal term
  licenceNumber?: string;
  licenceHolder?: string;
  imoNumber?: string; // International Maritime Organisation
  licenceValidTo?: string;
  rssNumber?: string; // Registry of Shipping and Seamen
  vesselLength?: number;
  label?: string;
  domId?: string;
  vesselOverriddenByAdmin?: boolean;
  vesselNotFound?: boolean;
}

export interface Weight {
  speciesId: string,
  speciesLabel?: string,
  exportWeight?: number,
  errors?: any;
  error?: string;
}
export interface DirectLanding {
  id?: string;
  vessel?: Vessel;
  startDate?: string;
  dateLanded?: string;
  faoArea?: string;
  weights: Weight[];
  gearCategory?: string;
  gearType?: string;
  numberOfSubmissions?: number;
  error?: string;
  errors?: {};
}

export interface Landing {
  id: string;
  vessel?: Vessel;
  dateLanded?: string;
  startDate?: string;
  exportWeight?: number;
  gearCategory?: string;
  gearType?: string;
  faoArea?: string;
  numberOfSubmissions?: number;
  dataEverExpected?: boolean;
  landingDataExpectedDate?: string;
  landingDataEndDate?: string;
  isLegallyDue?: boolean;
  vesselRiskScore?: number;
  exporterRiskScore?: number;
  speciesRiskScore?: number;
  threshold?: number;
  riskScore?: number;
  isSpeciesRiskEnabled?: boolean;
}
export interface LandingStatus {
  addMode?: boolean;
  editMode?: boolean;
  error?: string;
  errors?: {};
  model: Landing;
  modelCopy?: Landing;
}

export interface Product {
  id: string;
  commodityCode: string;
  commodityCodeAdmin?: string;
  commodityCodeDescription?: string,
  scientificName?: string,
  presentation?: Presentation;
  state?: State;
  species: Species;
  factor?: number;
}

export interface ProductLanded {
  product: Product;
  landings?: LandingStatus[];
}

export interface ProductsLanded {
  items: ProductLanded[];
  errors?: any;
  error?: string;
}

export interface SystemFailure {
  error: string;
  documentNumber?: string;
}

export interface ValidationFailure {
  state: string,
  species: string,
  presentation: string,
  date: Date,
  vessel: string,
  rules: string[]
}

export interface BaseProgress {
  reference?: ProgressStatus;
  exporter: ProgressStatus;
}

export interface Progress {
  progress: CatchCertificateProgress | ProcessingStatementProgress | StorageDocumentProgress,
  completedSections?: number,
  requiredSections?: number
}

export interface CertificateSummary {
  documentNumber: string;
  status: string;
  startedAt: string;
  exporter: CcExporter,
  exportPayload: ProductsLanded,
  conservation: Conservation,
  transport?: Transport,
  transportations?: CatchCertificateTransport[],
  exportLocation: ExportLocation,
  landingsEntryOption: BackEndModels.LandingsEntryOptions
  validationErrors: (ValidationFailure | SystemFailure)[]
}

export const getNumberOfUniqueLandings = (input: ProductsLanded): number => {
  const unique = new Set();

  input.items.forEach(item =>
    item.landings.forEach(landing => {
      unique.add(`${landing.model.vessel.pln}:${landing.model.dateLanded}`)
    })
  );

  return unique.size;
}

export const toCodeAndName = (input: CodeAndLabel): BackEndModels.State | BackEndModels.Presentation => {
  return {
    code: input.code,
    name: input.label,
    admin: input.admin
  }
};

const mapLandings = (landing: LandingStatus): BackEndModels.Catch => {
  const errors = (landing.errors) ? Object.keys(landing.errors) : [];
  const result: BackEndModels.Catch = {
    vessel: landing.model?.vessel?.vesselName,
    pln: landing.model?.vessel?.pln,
    homePort: landing.model?.vessel?.homePort,
    flag: landing.model?.vessel?.flag,
    cfr: landing.model?.vessel?.cfr,
    imoNumber: landing.model?.vessel?.imoNumber,
    licenceNumber: landing.model?.vessel?.licenceNumber,
    licenceValidTo: landing.model?.vessel?.licenceValidTo,
    licenceHolder: landing.model?.vessel?.licenceHolder,
    id: landing.model.id,
    date: landing.model.dateLanded,
    startDate: landing.model.startDate,
    faoArea: landing.model.faoArea,
    weight: landing.model.exportWeight,
    gearCategory: landing.model.gearCategory,
    gearType: landing.model.gearType,
    numberOfSubmissions: landing.model.numberOfSubmissions,
    vesselOverriddenByAdmin: landing.model?.vessel?.vesselOverriddenByAdmin,
    vesselNotFound: landing.model?.vessel?.vesselNotFound,
    dataEverExpected: landing.model.dataEverExpected,
    landingDataExpectedDate: landing.model.landingDataExpectedDate,
    landingDataEndDate: landing.model.landingDataEndDate,
    isLegallyDue: landing.model.isLegallyDue,
    vesselRiskScore: landing.model.vesselRiskScore,
    exporterRiskScore: landing.model.exporterRiskScore,
    speciesRiskScore: landing.model.speciesRiskScore,
    threshold: landing.model.threshold,
    riskScore: landing.model.riskScore,
    isSpeciesRiskEnabled: landing.model.isSpeciesRiskEnabled
  };

  if (errors.length > 0) {
    if (errors.includes('vessel.label') && errors.includes('vessel.vesselName')) {
      delete result['vessel']
    }
    if (errors.includes('dateLanded')) {
      delete result['date']
    }
    if (errors.includes('exportWeight')) {
      delete result['weight']
    }
  }

  Object.keys(result).forEach(key => result[key] === undefined ? delete result[key] : {});

  return result;
}

export const toBackEndCatches = (landings: LandingStatus[]): BackEndModels.Catch[] => {
  return (landings)
    ? landings.map<BackEndModels.Catch>((landing: LandingStatus) => mapLandings(landing))
    : [];
};

export const toBackEndProductsLanded = (productsLanded: ProductsLanded): BackEndModels.Product[] => {
  return (productsLanded.items)
    ? productsLanded.items.map<BackEndModels.Product>(productLanded => {
      return {
        speciesId: productLanded.product.id,
        species: productLanded.product.species.label,
        speciesAdmin: productLanded.product.species.admin,
        speciesCode: productLanded.product.species.code,
        commodityCode: productLanded.product.commodityCode,
        commodityCodeAdmin: productLanded.product.commodityCodeAdmin,
        commodityCodeDescription: productLanded.product.commodityCodeDescription,
        scientificName: productLanded.product.scientificName,
        state: toCodeAndName(productLanded.product.state) as BackEndModels.State,
        presentation: toCodeAndName(productLanded.product.presentation) as BackEndModels.Presentation,
        factor: productLanded.product.factor,
        caughtBy: toBackEndCatches(productLanded.landings)
      }
    })
    : [];
};

export const toFrontEndVessel = (landing: BackEndModels.Catch): Vessel => {
  const result = (landing.pln)
    ? {
      pln: landing.pln,
      vesselName: landing.vessel,
      label: `${landing.vessel} (${landing.pln})`,
      homePort: landing.homePort,
      flag: landing.flag,
      cfr: landing.cfr,
      imoNumber: landing.imoNumber,
      licenceNumber: landing.licenceNumber,
      licenceValidTo: landing.licenceValidTo,
      licenceHolder: landing.licenceHolder,
      vesselOverriddenByAdmin: landing.vesselOverriddenByAdmin,
      vesselNotFound: landing.vesselNotFound
    }
    : undefined;

  if (result) {
    Object.keys(result).forEach(key => result[key] === undefined ? delete result[key] : {});
  }

  return result;
}

export const toFrontEndProductLanded = (productLanded: BackEndModels.Product): ProductLanded => {
  const landings: LandingStatus[] = productLanded.caughtBy.map((landing: BackEndModels.Catch) => {
    const landingStatus: LandingStatus = {
      model: {
        id: landing.id,
        vessel: toFrontEndVessel(landing),
        faoArea: landing.faoArea,
        startDate: landing.startDate,
        dateLanded: landing.date,
        exportWeight: landing.weight,
        gearCategory: landing.gearCategory,
        gearType: landing.gearType,
        numberOfSubmissions: landing.numberOfSubmissions,
        isLegallyDue: landing.isLegallyDue,
        vesselRiskScore: landing.vesselRiskScore,
        exporterRiskScore: landing.exporterRiskScore,
        speciesRiskScore: landing.speciesRiskScore,
        threshold: landing.threshold,
        riskScore: landing.riskScore,
        isSpeciesRiskEnabled: landing.isSpeciesRiskEnabled
      }
    };

    Object.keys(landingStatus.model).forEach(key => landingStatus.model[key] === undefined ? delete landingStatus.model[key] : {});

    return landingStatus;
  });

  const res: ProductLanded = {
    product: {
      id: productLanded.speciesId,
      commodityCode: productLanded.commodityCode,
      commodityCodeAdmin: productLanded.commodityCodeAdmin,
      commodityCodeDescription: productLanded.commodityCodeDescription,
      presentation: productLanded.presentation ? {
        code: productLanded.presentation.code,
        label: productLanded.presentation.name,
        admin: productLanded.presentation.admin
      } : undefined,
      scientificName: productLanded.scientificName,
      state: productLanded.state ? {
        code: productLanded.state.code,
        label: productLanded.state.name,
        admin: productLanded.state.admin
      } : undefined,
      species: {
        code: productLanded.speciesCode,
        label: productLanded.species,
        admin: productLanded.speciesAdmin,
      },
      factor: productLanded.factor
    }
  };

  Object.keys(res.product).forEach(key => res.product[key] === undefined ? delete res.product[key] : {});
  if (landings?.length) {
    res.landings = landings;
  }

  return res;
};

export const toFrontEndProductsLanded = (products: BackEndModels.Product[] = []): ProductsLanded => ({
  items: products.map(_ => toFrontEndProductLanded(_))
});

export const toFrontEndDirectLanding = (products: BackEndModels.Product[]): DirectLanding => {
  const weights: Weight[] = products.map((product: BackEndModels.Product) => mapProductsForFrontEndDirectLanding(product));

  const landing: BackEndModels.Catch = (products[0]?.caughtBy && products[0].caughtBy.length > 0)
    ? products[0].caughtBy[0] : undefined;

  const vessel: Vessel = landing ? {
    vesselName: landing.vessel,
    pln: landing.pln,
    homePort: landing.homePort,
    flag: landing.flag,
    cfr: landing.cfr,
    imoNumber: landing.imoNumber,
    licenceNumber: landing.licenceNumber,
    licenceValidTo: landing.licenceValidTo,
    licenceHolder: landing.licenceHolder,
    vesselNotFound: landing.vesselNotFound,
    vesselOverriddenByAdmin: landing.vesselOverriddenByAdmin
  } : undefined;

  if (vessel !== undefined)
    Object.keys(vessel).forEach(key => vessel[key] === undefined ? delete vessel[key] : null);

  const result: DirectLanding = {
    id: landing ? landing.id : undefined,
    vessel,
    numberOfSubmissions: landing ? landing.numberOfSubmissions : undefined,
    startDate: landing?.startDate,
    gearCategory: landing?.gearCategory,
    gearType: landing?.gearType,
    dateLanded: landing ? landing.date : undefined,
    faoArea: landing ? landing.faoArea : undefined,
    weights: weights.map((weight: Weight) => {
      Object.keys(weight).forEach(key => mapWeights(weight, key));
      return weight;
    })
  }

  Object.keys(result).forEach(key => result[key] === undefined ? delete result[key] : null);

  return result;
}

const mapWeights = (weight: Weight, key:string) => weight[key] === undefined ? delete weight[key] : null

const mapProductsForFrontEndDirectLanding = (product: BackEndModels.Product) => ({
  speciesId: product ? product.speciesId : '',
  speciesLabel: (product?.species && product?.state && product?.presentation && product?.commodityCode) ?
    `${speciesName(product)}, ${stateName(product)}, ${presentationName(product)}, ${comodityCode(product)}`
    : undefined,
  exportWeight: product?.caughtBy && product?.caughtBy.length > 0 ? product?.caughtBy[0].weight : undefined
})

const speciesName = (product: BackEndModels.Product) => product.speciesAdmin ? product.speciesAdmin : product.species;
const stateName = (product: BackEndModels.Product) => product.state.admin ? product.state.admin : product.state.name;
const presentationName = (product: BackEndModels.Product) => product.presentation.admin ? product.presentation.admin : product.presentation.name;
const comodityCode = (product: BackEndModels.Product) => product.commodityCodeAdmin ? product.commodityCodeAdmin : product.commodityCode;

export const toFrontEndValidationFailure = (results: IExportCertificateResults | void): ValidationFailure[] =>
  results ? results.report.map(report => ({
    state: report.state,
    species: report.species,
    presentation: report.presentation,
    date: report.date,
    vessel: report.vessel,
    rules: report.failures
  })) : [];

export const toProduct = (payload: any): Product => payload ? ({
  id: payload.id,
  commodityCode: payload.product ? payload.product.commodity_code : '',
  commodityCodeAdmin: payload.product ? payload.product.commodity_code_admin : undefined,
  commodityCodeDescription: payload.product ? payload.product.commodity_code_description : undefined,
  scientificName: payload.product ? payload.product.scientificName : undefined,
  presentation: getPresentationObject(payload),
  state: getStateObject(payload),
  species: getSpeciesObject(payload),
  factor: payload.factor
}) : undefined;

const getPresentationObject = (payload) => ({
  code: payload.product ? payload.product.presentation : '',
  label: payload.product ? payload.product.presentationLabel : '',
  admin: payload.product ? payload.product.presentationAdmin : undefined
})

const getStateObject = (payload) => ({
  code: payload.product ? payload.product.state : '',
  label: payload.product ? payload.product.stateLabel : '',
  admin: payload.product ? payload.product.stateAdmin : undefined
})

const getSpeciesObject = (payload) => ({
  code: payload.product ? payload.product.speciesCode : '',
  label: payload.product ? payload.product.species : '',
  admin: payload.product ? payload.product.speciesAdmin : undefined
})

