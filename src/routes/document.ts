
import * as Hapi from '@hapi/hapi';

import * as Joi from 'joi';
import DocumentController from '../controllers/document.controller';
import { defineAuthStrategies } from '../helpers/auth';
import { catchCerts, storageNote, processingStatement } from '../services/documentNumber.service';


export default class DocumentRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/documents/{year}/{month}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Get documents from redis and mongo',
            handler: DocumentController.getAllDocuments,
            tags: ['api'],
            validate: {
              options: {
                abortEarly: false
              },
              query: Joi.object({
                type: Joi.string().required().valid(catchCerts, storageNote, processingStatement)
              }),
              params: Joi.object({
                year: Joi.number().integer().min(1900).max(2200).required(),
                month: Joi.number().integer().min(1).max(12).required()
              })
            }
          }
        },
        {
          method: 'GET',
          path: '/v1/document',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: DocumentController.getDocumentFromRedis,
            description: 'Get document from redis',
            tags: ['api', 'document'],
            validate:{
              options: {
                abortEarly: false
              },
              query: Joi.object({
                service: Joi.string().required().valid(catchCerts, storageNote, processingStatement)
              })
            }
          }
        },
        {
          method: 'GET',
          path: '/v1/document/{documentNumber}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: DocumentController.getDocument,
            description: 'Get some details on a given document',
            tags: ['api', 'document'],
            validate:{
              options: {
                abortEarly: false
              },
              params: Joi.object({
                documentNumber: Joi.string().required().regex(/^GBR-(19|20|21)[0-9]{2}-(CC|PS|SD)-[A-Z0-9]{9}$/)
              })
            }
          }
        },
        {
          method: 'POST',
          path: '/v1/document/{documentType}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: DocumentController.createDraft,
            description: 'Create a new draft',
            tags: ['api', 'document']
          }
        },
        {
          method: 'GET',
          path: '/v1/documents/completed/{documentType}',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Get all completed documents for a user',
            handler: DocumentController.getAllCompletedDocuments,
            tags: ['api'],
            validate: {
              options: {
                abortEarly: false
              },
              query: Joi.object({
                pageNumber: Joi.number().integer(),
                pageLimit: Joi.number().integer(),
              }),
              params: Joi.object({
                documentType: Joi.string().required().valid(catchCerts, storageNote, processingStatement)
              })
            }
          }
        },
      ]);
      resolve(null);
    });
  }


}
