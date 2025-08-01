import * as urlParser from 'url-parse';
import * as dotenv from 'dotenv';
import logger from "./logger";

dotenv.config();

class ApplicationConfig {
  _referenceServiceHost: string;
  _host: string;
  _port: any;
  _redisHostName: string;
  _redisPort: any;
  _redisTlsEnabled: string;
  _redisTlsHostName: string;
  _redisPassword: string;
  _instrumentationKey: string;
  _cloudRoleName: string;
  _refServiceBasicAuthUser: string;
  _refServiceBasicAuthPassword: string;
  _disableAuth: boolean;
  _dbName: string;
  _dbConnectionUri: string;
  _dbConnectionPool: string;
  _enablePdfGen: boolean;
  _maximumConcurrentDrafts: number;
  _maximumLandingsForOnlineValidation: number;
  _landingLimitDaysInTheFuture: number;
  _businessContinuityKey: string;
  _businessContinuityUrl: string;
  _maximumFavouritesPerUser: number;
  eventHubConnectionString: string;
  eventHubNamespace: string;
  _maxLimitLandings: number;
  _maxUploadFileSize: number;
  _fesApiMasterPassword: string;
  _fesNotifyApiKey: string;
  _fesNotifySuccessTemplateId: string;
  _fesNotifyFailureTemplateId: string;
  _fesNotifyTechnicalErrorTemplateId: string;
  _blobStorageConnection: string;
  _lastUpdatedPrivacyStatement: string;
  _lastUpdatedCookiePolicy: string;
  _maxAuthRetries: number;
  _consolidationServicUrl: string;
  _identityAppUrl: string;

  loadProperties() {
    this._disableAuth = process.env.DISABLE_AUTH === 'true';
    this._referenceServiceHost = process.env.MMO_ECC_REFERENCE_SVC_URL;
    this._host = process.env.HOST;
    this._port = process.env.PORT || 5500;
    this._redisHostName = process.env.REDIS_HOST_NAME;
    this._redisPort = process.env.REDIS_PORT || 6380;
    this._redisTlsEnabled = process.env.REDIS_TLS_ENABLED;
    this._redisTlsHostName = process.env.REDIS_TLS_HOST_NAME;
    this._instrumentationKey = process.env.INSTRUMENTATION_KEY;
    this._cloudRoleName = process.env.INSTRUMENTATION_CLOUD_ROLE;
    this._enablePdfGen = process.env.ENABLE_PDF_GEN === 'true';
    this._maximumConcurrentDrafts = parseInt(process.env.MAXIMUM_CONCURRENT_DRAFTS);
    this._maximumLandingsForOnlineValidation = parseInt(process.env.MAXIMUM_LANDINGS_FOR_ONLINE_VALIDATION, 10);
    this._landingLimitDaysInTheFuture = parseInt(process.env.LANDING_LIMIT_DAYS_IN_THE_FUTURE, 10);
    this._businessContinuityKey = process.env.BUSINESS_CONTINUITY_KEY;
    this._businessContinuityUrl = process.env.BUSINESS_CONTINUITY_URL;
    this._maximumFavouritesPerUser = parseInt(process.env.MAXIMUM_FAVOURITES_PER_USER, 10);
    this._fesNotifySuccessTemplateId = process.env.FES_NOTIFY_SUCCESS_TEMPLATE_ID;
    this._fesNotifyFailureTemplateId = process.env.FES_NOTIFY_FAILURE_TEMPLATE_ID;
    this._fesNotifyTechnicalErrorTemplateId = process.env.FES_NOTIFY_TECHNICAL_ERROR_TEMPLATE_ID;

    this._blobStorageConnection = process.env.BLOB_STORAGE_CONNECTION;
    this._fesApiMasterPassword = process.env.FES_API_MASTER_PASSWORD;
    if (!this._fesApiMasterPassword) {
      logger.error('FES_API_MASTER_PASSWORD is not set');
    }
    this._fesNotifyApiKey = process.env.FES_NOTIFY_API_KEY;
    this._consolidationServicUrl = process.env.MMO_CC_LANDINGS_CONSOLIDATION_SVC_URL;
    this._identityAppUrl = process.env.IDENTITY_APP_URL;
    if (!this._identityAppUrl) {
      logger.error('IDENTITY_APP_URL is not set');
    }


    if (isNaN(this._maximumFavouritesPerUser)) {
      logger.error('MAXIMUM_FAVOURITES_PER_USER is not set');
    }

    // dynamic props
    this._refServiceBasicAuthUser = process.env.REF_SERVICE_BASIC_AUTH_USER;
    this._refServiceBasicAuthPassword = process.env.REF_SERVICE_BASIC_AUTH_PASSWORD;
    this._redisPassword = (process.env.REDIS_PASSWORD !== undefined) ? process.env.REDIS_PASSWORD : process.env.ORCH_REDIS_PASSWORD;

    // DB settings
    this._dbName = process.env.DB_NAME;
    this._dbConnectionUri = process.env.DB_CONNECTION_URI || process.env.COSMOS_DB_RW_CONNECTION_URI;
    this._dbConnectionPool = process.env.DB_CONNECTION_POOL;

    // event hub properties
    this.eventHubConnectionString = process.env.eventHubConnectionString;
    this.eventHubNamespace = process.env.eventHubNamespace;

    this._maxLimitLandings = parseInt(process.env.LIMIT_ADD_LANDINGS, 10);
    this._maxUploadFileSize = parseInt(process.env.MAX_UPLOAD_FILE_SIZE, 10)
    this._lastUpdatedPrivacyStatement = process.env.LAST_UPDATED_PRIVACY_STATEMENT;
    this._lastUpdatedCookiePolicy = process.env.LAST_UPDATED_COOKIE_POLICY;

    this._maxAuthRetries = parseInt(process.env.MAX_AUTH_RETRIES, 10) || 2;
  }

  getReferenceServiceUrl(): string {
    const parsed = urlParser(this._referenceServiceHost);
    parsed.set('username', this._refServiceBasicAuthUser);
    parsed.set('password', this._refServiceBasicAuthPassword);
    return parsed.toString().replace(/(\/)+$/, '');
  }

  getEventHubNamespace(): string {
    return this.eventHubNamespace;
  }

  getEventHubConnectionString(): string {
    return this.eventHubConnectionString;
  }

  getApplicationHost(): string {
    return this._referenceServiceHost;
  }

  getConsolidationServiceUrl(): string {
    return this._consolidationServicUrl;
  }

  isOfflineValidation(numberOfLandings: number): boolean {
    return (numberOfLandings > this._maximumLandingsForOnlineValidation);
  }

  getAuthIssuer() {
    return this._identityAppUrl;
  }

  getAuthSecret() {
    return this._fesApiMasterPassword;
  }
}

export default new ApplicationConfig();
