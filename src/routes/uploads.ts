import * as Hapi from "@hapi/hapi";
import * as Joi from 'joi';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import UploadsController from "../controllers/uploads.controller";
import acceptsHtml from '../helpers/acceptsHtml';
import errorExtractor from "../helpers/errorExtractor";
import logger from '../logger';
import ApplicationConfig from "../applicationConfig";
import { virusDetected } from "../services/reference-data.service";
import { IUploadedLanding } from "../persistence/schema/uploads";
import { isEmpty } from "lodash";

export default class UploadsRoutes {
  public register(server: Hapi.Server): any {
    server.route([
      {
        method: "POST",
        path: "/v1/uploads/landings",
        options: {
          security: true,
          cors: true,
          handler: async function (req, h) {
            return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
              const payload = req.payload as any;
              if (payload?.file) {
                if (getFileExtension(payload.file) !== 'csv') {
                  return h.response(getFileValidationError("error.upload.invalid-file-type")).code(400);
                }

                const csv = await getFileContent(payload.file);
                if (csv.trim() === '') {
                  return h.response(getFileValidationError("error.upload.min-landings")).code(400);
                }

                const fileHasVirus = await virusDetected(getFileName(payload.file),csv,documentNumber);

                if (fileHasVirus  === true) {
                  return h.response(getFileValidationError("error.upload.invalid-columns")).code(400);
                }

                if (fileHasVirus === undefined) {
                  return h.response(getFileValidationError("error.upload.av-failed")).code(400);
                }

                return await UploadsController.parseLandingsFile(csv, userPrincipal, contactId)
                  .then(result => {
                    return h.response(result);
                  })
                  .catch(error => {
                    return h.response(getFileValidationError(error.message)).code(400).takeover();
                  });
              }

              return h.response(getFileValidationError("error.upload.min-landings")).code(400);
            });
          },
          payload: {
            maxBytes: ApplicationConfig._maxUploadFileSize,
            output: "stream",
            parse: true,
            multipart: { output: "stream" },
            failAction: function (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, _e: any) {
              return h.response(getFileValidationError("error.upload.max-file-size")).code(400).takeover();
            }
          },
          description: "upload landings",
          tags: ["api", "upload", "landings"],
        },
      },
      {
        method: "POST",
        path: "/v2/uploads/landings",
        options: {
          security: true,
          cors: true,
          handler: async function (req, h) {
            return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
              const payload = req.payload as any;
              if (payload?.file) {

                if (isEmpty(getFileName(payload.file))) {
                  return h.response(getFileValidationError("error.upload.missing-file")).code(400);
                }

                if (getFileExtension(payload.file) !== 'csv') {
                  return h.response(getFileValidationError("error.upload.invalid-file-type")).code(400);
                }

                const csv = await getFileContent(payload.file);
                if (csv.trim() === '') {
                  return h.response(getFileValidationError("error.upload.min-landings")).code(400);
                }

                const fileHasVirus = await virusDetected(getFileName(payload.file),csv,documentNumber);

                if (fileHasVirus  === true) {
                  return h.response(getFileValidationError("error.upload.invalid-columns")).code(400);
                }

                if (fileHasVirus === undefined) {
                  return h.response(getFileValidationError("error.upload.av-failed")).code(400);
                }

                return await UploadsController.parseLandingsFile(csv, userPrincipal, contactId, true)
                  .then(result => {
                    return h.response(result);
                  })
                  .catch(error => {
                    return h.response(getFileValidationError(error.message)).code(400).takeover();
                  });
              }

              return h.response(getFileValidationError("error.upload.min-landings")).code(400);
            });
          },
          payload: {
            maxBytes: ApplicationConfig._maxUploadFileSize,
            output: "stream",
            parse: true,
            multipart: { output: "stream" },
            failAction: function (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, _e: any) {
              return h.response(getFileValidationError("error.upload.max-file-size")).code(400).takeover();
            }
          },
          description: "upload landings",
          tags: ["api", "upload", "landings"],
        },
      },
      {
        method: "POST",
        path: "/v1/save/landings",
        options: {
          security: true,
          cors: true,
          handler: async function (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
            return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
              return await UploadsController.saveLandingRows(req, h, userPrincipal, documentNumber, contactId, (req.payload as any).file);
            }).catch(error => {
              logger.error(`[SAVE-UPLOAD-FILE][ERROR][${error}]`);
              return h.response().code(500);
            })
          },
          description: "upload landings",
          tags: ["api", "upload", "landings"],
          validate: {
            options: {
              abortEarly: false
            },
            payload: Joi.object({
              file: Joi.array().min(1).max(ApplicationConfig._maxLimitLandings).required(),
              currentUri: Joi.string().trim().required(),
            }),
            failAction: function (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, error: any) {
              const errorObject = errorExtractor(error);
              if (acceptsHtml(req.headers)) {
                return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
              }
              return h.response(errorObject).code(400).takeover();
            }
          }
        },
      },
      {
        method: "POST",
        path: "/v2/save/landings",
        options: {
          security: true,
          cors: true,
          handler: async function (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
            return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
              const rows: IUploadedLanding[] = await UploadsController.getCacheUploadedRows(userPrincipal, contactId);

              if (rows === undefined || rows === null) {
                return h.response({ file: 'error.file.any.required' }).code(400);
              }

              if (Array.isArray(rows) && rows.length === 0) {
                return h.response({ file: 'error.file.array.min' }).code(400);
              }

              if (Array.isArray(rows) && rows.length > 100) {
                return h.response(              {
                  file: {
                    key: 'error.file.array.max',
                    params: {
                      limit: ApplicationConfig._maxLimitLandings
                    }
                  }
                }).code(400);
              }

              const response: Hapi.ResponseObject = await UploadsController.saveLandingRows(req, h, userPrincipal, documentNumber, contactId, rows);
              UploadsController.invalidateCacheUploadedRows(userPrincipal, contactId);
              return response;
            }).catch(error => {
              logger.error(`[SAVE-UPLOAD-FILE][ERROR][${error}]`);
              return h.response().code(500);
            })
          },
          description: "upload landings",
          tags: ["api", "upload", "landings"],
          validate: {
            options: {
              abortEarly: false
            },
            payload: Joi.object({
              currentUri: Joi.string().trim().required(),
            }),
            failAction: function (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, error: any) {
              const errorObject = errorExtractor(error);
              if (acceptsHtml(req.headers)) {
                return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
              }
              return h.response(errorObject).code(400).takeover();
            }
          }
        }
      },
      {
        method: "POST",
        path: "/v2/clear/landings",
        options: {
          security: true,
          cors: true,
          handler: async function (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
            return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
              await UploadsController.invalidateCacheUploadedRows(userPrincipal, contactId);
              return h.response([]).code(200);
            }).catch(error => {
              logger.error(`[CLEAR-UPLOAD-FILE][ERROR][${error}]`);
              return h.response().code(500);
            })
          },
          description: "upload landings",
          tags: ["api", "upload", "landings"]
        },
      }
    ]);
  }
}

export const getFileValidationError = (errorKey: string) => {
  if (errorKey === "error.upload.max-landings") {
    return {
      file: {
        key: errorKey,
        params: {
          limit: ApplicationConfig._maxLimitLandings
        }
      }
    }
  }
  else if (errorKey === "error.upload.max-file-size") {
    return {
      file: {
        key: errorKey,
        params: {
          maxBytes: ApplicationConfig._maxUploadFileSize
        }
      }
    }
  }
  else if (/^error\.upload/.test(errorKey)) {
    return {
      file: errorKey
    };
  }
  else {
    return {
      file: "error.upload.invalid-columns"
    };
  }
};

export const getFileExtension = (file: any): string =>
  file.hapi.filename.split('.').reverse()[0];

export const getFileContent = async (file: any): Promise<string> => {
  let res = '';
  for await (const chunk of file) {
    res += chunk;
  }
  return res;
};

export const getFileName = (file : any) : string => file.hapi.filename;
