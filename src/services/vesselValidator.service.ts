import * as moment from 'moment';
import { ProductLanded, LandingStatus, ValidationFailure } from '../persistence/schema/frontEndModels/payload';
import * as Reference from './reference-data.service';

export default class VesselValidator {

  public static async checkVesselWithDate(exportedData: ProductLanded[]) {

    const validate = await Promise.all(exportedData.map(async function(item: ProductLanded) {
      const itemloop = await Promise.all(item.landings.map(async function(landing: LandingStatus) {

        if (!landing.model.vessel && !landing.model.dateLanded) {

          return false;

        }

        if (!landing.model.vessel || !landing.model.dateLanded) {

          return false;

        }

        if (!moment(landing.model.dateLanded).isValid()) {

          return false;

        }

        if (landing.model.vessel.vesselOverriddenByAdmin) {

          return true;

        }

        const check = await Reference.checkVesselLicense(landing.model.vessel, landing.model.dateLanded);

        if (check.response && check.response.status === 404) {

          return false;

      }

      return true;

      }));

      return itemloop;

    }));

    return validate;
  }


  public static readonly vesselsAreValid = async (items: ProductLanded[]) =>
    await VesselValidator.checkVesselWithDate(items)
      .then(_ => true)
      .catch(_e => {
        return false;
      });

  public static getProductsWithVesselNotFound(exportedData: ProductLanded[]): ProductLanded[] {
    return exportedData.filter(VesselValidator.hasProductsWithVesselsNotFound);
  }

  public static readonly hasProductsWithVesselsNotFound = (item: ProductLanded): boolean =>
    item?.landings
      ? item.landings.some((land: LandingStatus) => land.model.vessel.vesselNotFound)
      : false;

  public static readonly vesselsNotFound = (items: ProductLanded[]): ValidationFailure[] => {
    const validationFailures: ValidationFailure[] = [];

    VesselValidator.getProductsWithVesselNotFound(items).forEach(
      (item: ProductLanded) => {
        if (item.landings) {
          item.landings.forEach((landing: LandingStatus) => {
            if (landing.model.vessel.vesselNotFound) {
              validationFailures.push({
                state: item.product.state.code,
                species: item.product.species.code,
                presentation: item.product.presentation.code,
                date: moment.utc(landing.model.dateLanded).toDate(),
                vessel: landing.model.vessel.vesselName,
                rules: ["vesselNotFound"],
              });
            }
          });
        }
      }
    );

    return validationFailures;
  };

  public static readonly invalidLandingDates = (items: ProductLanded[]): ValidationFailure[] => {
    const maxSubmissionDate = moment(Date.now()).add(3, 'days');
    const isAfterMaxSubmissionDate = (date: string) => moment(date).isAfter(maxSubmissionDate, 'day');

    return [...items].reduce((errors : ValidationFailure[], item: ProductLanded) => {
      item.landings.forEach((landing: LandingStatus) => {
        if (landing.model.dateLanded && isAfterMaxSubmissionDate(landing.model.dateLanded)) {
          errors.push({
            state: item.product.state.code,
            species: item.product.species.code,
            presentation: item.product.presentation.code,
            date: moment.utc(landing.model.dateLanded).toDate(),
            vessel: landing.model.vessel.vesselName,
            rules: ["invalidLandingDate"]
          })
        }
      });

      return errors;
    }, []);
  }
}
