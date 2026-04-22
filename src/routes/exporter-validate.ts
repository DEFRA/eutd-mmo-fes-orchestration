import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';
import logger from '../logger';
import Controller from "../controllers/exporter.controller";
import { validateCountriesName } from '../validators/countries.validator';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import acceptsHtml from '../helpers/acceptsHtml';
import errorExtractor from "../helpers/errorExtractor";
import { validateNoEmoji } from '../validators/emojiValidator';

import ApplicationConfig from '../applicationConfig';
import { ICountry } from '../persistence/schema/common';
import { COUNTRY } from '../services/constants';
import { defineAuthStrategies } from '../helpers/auth';
export default class ExporterValidateRoutes {

  private formatAddressFirstPart(address: any): string {
    const addressLineOne: string[] = [];

    if (address?.buildingNumber?.trim()) {
      addressLineOne.push(address.buildingNumber.trim());
    }

    if (address?.subBuildingName?.trim()) {
      addressLineOne.push(address.subBuildingName.trim());
    }

    if (address?.buildingName?.trim()) {
      addressLineOne.push(address.buildingName.trim());
    }

    if (address?.streetName?.trim()) {
      addressLineOne.push(address.streetName.trim());
    }

    return (addressLineOne.length > 0)
      ? addressLineOne.filter((_: string) => _ !== 'null').join(', ')
      : '';
  }

  private async handleExporterValidation(
    req: Hapi.Request,
    h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>,
    userPrincipal: string,
    documentNumber: string,
    contactId: string
  ): Promise<any> {
    const addressFirstPart = this.formatAddressFirstPart(req.payload);
    await Controller.addExporterDetails(req, h, false, userPrincipal, documentNumber, contactId);
    return { ...(req.payload as any), addressOne: addressFirstPart };
  }

  private buildExporterValidateRoute(): Hapi.ServerRoute {
    return {
      method: 'POST',
      path: '/v1/exporter-validate',
      options: {
        auth: defineAuthStrategies(),
        security: true,
        cors: true,
        description: 'Validate the Exporters address details',
        handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
          return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
            return this.handleExporterValidation(req, h, userPrincipal, documentNumber, contactId);
          }).catch(error => {
            logger.error(`[EXPORTER-VALIDATE][ERROR][${error.stack || error}]`);
            return h.response().code(500);
          });
        },
        tags: ['api', 'exporters details'],
        validate: {
          options: {
            abortEarly: false
          },
          payload: async (value: any) => this.validateExporterPayload(value),
          failAction: (req, h, error) => this.handleValidationError(req, h, error)
        }
      }
    };
  }

  private async validateExporterPayload(value: any): Promise<any> {
      const schema = Joi.object().keys({
        subBuildingName: Joi.string().allow('').custom(validateNoEmoji).regex(/^[A-Za-z0-9'/\-.,() &!]+$/),
        buildingNumber: Joi.string().regex(/^[a-zA-Z0-9\-, ]+$/).allow(''),
        buildingName: Joi.string().allow('').custom(validateNoEmoji).regex(/^[A-Za-z0-9'/\-., &!]+$/),
        streetName: Joi.string().allow('').custom(validateNoEmoji).regex(/^[A-Za-z0-9'/\-.,() &!]+$/),
        townCity: Joi.string().trim().custom(validateNoEmoji).regex(/^[A-Za-z0-9'/\-., &!]+$/).required(),
        county: Joi.string().allow('').custom(validateNoEmoji).regex(/^[A-Za-z0-9'/\-., &!]+$/),
        postcode: Joi.string().regex(/^[a-zA-Z0-9\-, ]+$/).required().min(5).max(8),
        country: Joi.string().custom(validateNoEmoji).required()
      });

      const errors = schema.validate(value, {
        abortEarly: false,
        allowUnknown: true
      });

      const validationErrors = errors.error ? errors.error.details : [];
      this.validateAddressFirstPart(value, validationErrors);

      if (validationErrors.length > 0) {
        throw new Joi.ValidationError('ValidationError', validationErrors, value);
      }

      if (COUNTRY.includes(value.country.toUpperCase())) {
        return value;
      }

      await this.validateCountryWithReference(value);
      return value;
    }

    private validateAddressFirstPart(value: any, validationErrors: any[]): void {
      if (value && !value.subBuildingName && !value.buildingNumber && !value.buildingName && !value.streetName) {
        validationErrors.push({
          message: '"addressFirstPart" is required',
          path: ['addressFirstPart'],
          type: 'any.required',
          context: { key: 'addressFirstPart', label: 'addressFirstPart' }
        });
      }
    }

    private async validateCountryWithReference(value: any): Promise<void> {
      const refUrl = ApplicationConfig.getReferenceServiceUrl();
      const country: ICountry = {
        officialCountryName: value.country,
        isoCodeAlpha2: value.isoCodeAlpha2,
        isoCodeAlpha3: value.isoCodeAlpha3,
        isoNumericCode: value.isoNumericCode
      };

      const anyError = await validateCountriesName(country, refUrl, 'country');
      if (anyError.isError) {
        logger.error(`[EXPORTER-VALIDATE][ERROR][INVALID-COUNTRY][${value.country}]`);
        throw anyError.error;
      }
    }

    private handleValidationError(req: any, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, error: any): any {
      const errorObject = errorExtractor(error);
      if (acceptsHtml(req.headers)) {
        return h.redirect(`${(req.payload).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
      }
      // API consumers expect array format
      const errorArray = Object.values(errorObject);
      return h.response(errorArray).code(400).takeover();
    }

    public async register(server: Hapi.Server): Promise<void> {
      server.route(this.buildExporterValidateRoute());
    }
}