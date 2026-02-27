import * as moment from 'moment';
import directLandingsSchema from '../../../src/schemas/catchcerts/directLandingsSchema';
import { buildNonJsErrorObject } from '../../../src/helpers/errorExtractor';
import ApplicationConfig from '../../../src/applicationConfig';

if (!process.env.LANDING_LIMIT_DAYS_IN_THE_FUTURE) {
	process.env.LANDING_LIMIT_DAYS_IN_THE_FUTURE = '7';
	Object.assign(ApplicationConfig, new (ApplicationConfig as any).constructor());
}

function validateNonJs(obj: any): any {
	const res = directLandingsSchema.validate(obj, { abortEarly: false });
	if (!res.error) return null;
	return buildNonJsErrorObject(res.error, obj);
}

interface DirectLandingPayload {
	dateLanded?: string;
	startDate?: string;
	faoArea?: string;
	vessel?: {
		vesselName?: string;
	};
	weights?: Array<{
		speciesId?: string;
		exportWeight?: number;
	}>;
	gearCategory?: string;
	gearType?: string;
	highSeasArea?: string;
	exclusiveEconomicZones?: Array<any>;
	rfmo?: string;
}

const basePayload: DirectLandingPayload = {
	dateLanded: '2026-02-15',
	startDate: '2026-02-10',
	faoArea: 'FAO27',
	vessel: {
		vesselName: 'Test Vessel'
	},
	weights: [
		{
			speciesId: 'COD',
			exportWeight: 100.50
		}
	],
	gearCategory: 'Nets',
	gearType: 'Trawl',
	highSeasArea: 'Yes'
};

describe('directLandingsSchema - dateLanded validation', () => {
	it('returns any.required error when dateLanded is missing', () => {
		const payload = { ...basePayload };
		delete payload.dateLanded;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const dateErr = error.details.find((d: any) => d.path.join('.') === 'dateLanded');
		expect(dateErr).toBeDefined();
		expect(dateErr.type).toBe('any.required');
	});

	it('returns directLanding.date.base error when all dateLanded parts are blank (e.g., "   -   -   ")', () => {
		const payload = { ...basePayload, dateLanded: '   -   -   ' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const dateErr = error.details.find((d: any) => d.path.join('.') === 'dateLanded');
		expect(dateErr).toBeDefined();
		expect(dateErr.type).toBe('directLanding.date.base');
	});

	it('passes validation with dateLanded having an empty part (e.g., 2026--15)', () => {
		const payload = { ...basePayload, dateLanded: '2026--15' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		// The schema only checks if ALL parts are empty, so '2026--15' passes the parts check
		// but will fail on moment validation
		expect(error).toBeDefined();
		const dateErr = error.details.find((d: any) => d.path.join('.') === 'dateLanded');
		expect(dateErr).toBeDefined();
		expect(dateErr.type).toBe('directLanding.date.invalid');
	});

	it('returns an error when dateLanded has wrong number of parts (e.g., 2026-02)', () => {
		const payload = { ...basePayload, dateLanded: '2026-02' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const dateErr = error.details.find((d: any) => d.path.join('.') === 'dateLanded');
		expect(dateErr).toBeDefined();
		// parts[2] is undefined so padStart throws; Joi wraps unhandled custom errors as any.custom
		expect(dateErr.type).toBe('any.custom');
	});

	it('returns directLanding.date.invalid error when dateLanded is invalid date', () => {
		const payload = { ...basePayload, dateLanded: '2026-02-31' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const dateErr = error.details.find((d: any) => d.path.join('.') === 'dateLanded');
		expect(dateErr).toBeDefined();
		expect(dateErr.type).toBe('directLanding.date.invalid');
	});

	it('returns date.max error when dateLanded exceeds future limit', () => {
		if (isNaN(ApplicationConfig._landingLimitDaysInTheFuture) || ApplicationConfig._landingLimitDaysInTheFuture === 0) {
			return;
		}
		const futureDate = moment().add(ApplicationConfig._landingLimitDaysInTheFuture + 5, 'days').format('YYYY-MM-DD');
		const payload = { ...basePayload, dateLanded: futureDate, startDate: futureDate };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const dateErr = error.details.find((d: any) => d.path.join('.') === 'dateLanded');
		expect(dateErr).toBeDefined();
		expect(dateErr.type).toBe('date.max');
	});

	it('passes validation with valid dateLanded within future limit', () => {
		if (isNaN(ApplicationConfig._landingLimitDaysInTheFuture) || ApplicationConfig._landingLimitDaysInTheFuture === 0) {
			return;
		}
		const validFutureDate = moment().add(ApplicationConfig._landingLimitDaysInTheFuture - 1, 'days').format('YYYY-MM-DD');
		const payload = { ...basePayload, dateLanded: validFutureDate, startDate: validFutureDate };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('passes validation with properly formatted date', () => {
		const payload = { ...basePayload, dateLanded: '2026-02-15' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});
});

describe('directLandingsSchema - startDate validation', () => {
	it('returns any.required error when startDate is missing', () => {
		const payload = { ...basePayload };
		delete payload.startDate;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const startErr = error.details.find((d: any) => d.path.join('.') === 'startDate');
		expect(startErr).toBeDefined();
		expect(startErr.type).toBe('any.required');
	});

	it('returns date.base error when startDate has wrong format', () => {
		const payload = { ...basePayload, startDate: '2026-02' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const startErr = error.details.find((d: any) => d.path.join('.') === 'startDate');
		expect(startErr).toBeDefined();
		expect(startErr.type).toBe('date.base');
	});

	it('returns date.base error when startDate is invalid', () => {
		const payload = { ...basePayload, startDate: '2026-13-01' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const startErr = error.details.find((d: any) => d.path.join('.') === 'startDate');
		expect(startErr).toBeDefined();
		expect(startErr.type).toBe('date.base');
	});

	it('returns date.max error when startDate is after dateLanded', () => {
		const payload = { ...basePayload, dateLanded: '2026-02-10', startDate: '2026-02-15' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const startErr = error.details.find((d: any) => d.path.join('.') === 'startDate');
		expect(startErr).toBeDefined();
		expect(startErr.type).toBe('date.max');
	});

	it('passes validation when startDate equals dateLanded', () => {
		const payload = { ...basePayload, dateLanded: '2026-02-15', startDate: '2026-02-15' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('passes validation when startDate is before dateLanded', () => {
		const payload = { ...basePayload, dateLanded: '2026-02-15', startDate: '2026-02-10' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});
});

describe('directLandingsSchema - faoArea validation', () => {
	it('returns any.required error when faoArea is missing', () => {
		const payload = { ...basePayload };
		delete payload.faoArea;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const faoErr = error.details.find((d: any) => d.path.join('.') === 'faoArea');
		expect(faoErr).toBeDefined();
		expect(faoErr.type).toBe('any.required');
	});

	it('returns any.only error when faoArea is invalid', () => {
		const payload = { ...basePayload, faoArea: 'INVALID_FAO' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const faoErr = error.details.find((d: any) => d.path.join('.') === 'faoArea');
		expect(faoErr).toBeDefined();
		expect(faoErr.type).toBe('any.only');
	});

	it('passes validation with valid FAO area codes', () => {
		const validFaoAreas = ['FAO18', 'FAO27', 'FAO37', 'FAO51', 'FAO87'];
		validFaoAreas.forEach(faoArea => {
			const payload = { ...basePayload, faoArea };
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
			expect(error).toBeUndefined();
		});
	});

	it('trims whitespace from faoArea', () => {
		const payload = { ...basePayload, faoArea: '  FAO27  ' };
		const { error, value } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
		expect(value.faoArea).toBe('FAO27');
	});
});

describe('directLandingsSchema - vessel validation', () => {
	it('returns any.required error when vessel is missing', () => {
		const payload = { ...basePayload };
		delete payload.vessel;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const vesselErr = error.details.find((d: any) => d.path.join('.') === 'vessel');
		expect(vesselErr).toBeDefined();
		expect(vesselErr.type).toBe('any.required');
	});

	it('returns any.required error when vesselName is missing', () => {
		const payload = { ...basePayload, vessel: {} };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const vesselNameErr = error.details.find((d: any) => d.path.join('.') === 'vessel.vesselName');
		expect(vesselNameErr).toBeDefined();
		expect(vesselNameErr.type).toBe('any.required');
	});

	it('passes validation with valid vesselName', () => {
		const payload = { ...basePayload, vessel: { vesselName: 'My Test Vessel' } };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('passes validation with vesselName containing surrounding whitespace (trimmed by Joi before custom validator)', () => {
		const payload = { ...basePayload, vessel: { vesselName: '  Test Vessel  ' } };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('returns string.empty error when vesselName is whitespace only', () => {
		const payload = { ...basePayload, vessel: { vesselName: '   ' } };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const vesselNameErr = error.details.find((d: any) => d.path.join('.') === 'vessel.vesselName');
		expect(vesselNameErr).toBeDefined();
		expect(vesselNameErr.type).toBe('string.empty');
	});

	it('passes validation when isListed is true', () => {
		const payload = { ...basePayload, vessel: { vesselName: 'Test Vessel', isListed: true } };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('returns directLanding.vessel.isListed.base error when isListed is false', () => {
		const payload = { ...basePayload, vessel: { vesselName: 'Test Vessel', isListed: false } };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const isListedErr = error.details.find((d: any) => d.path.join('.') === 'vessel.isListed');
		expect(isListedErr).toBeDefined();
		expect(isListedErr.type).toBe('directLanding.vessel.isListed.base');
	});
});

describe('directLandingsSchema - weights validation', () => {
	it('returns any.required error when weights is missing', () => {
		const payload = { ...basePayload };
		delete payload.weights;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const weightsErr = error.details.find((d: any) => d.path.join('.') === 'weights');
		expect(weightsErr).toBeDefined();
		expect(weightsErr.type).toBe('any.required');
	});

	it('returns array.min error when weights array is empty', () => {
		const payload = { ...basePayload, weights: [] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const weightsErr = error.details.find((d: any) => d.path.join('.') === 'weights');
		expect(weightsErr).toBeDefined();
		expect(weightsErr.type).toBe('array.min');
	});

	it('returns any.required error when speciesId is missing', () => {
		const payload = { ...basePayload, weights: [{ exportWeight: 100 }] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const speciesErr = error.details.find((d: any) => d.path.join('.') === 'weights.0.speciesId');
		expect(speciesErr).toBeDefined();
		expect(speciesErr.type).toBe('any.required');
	});

	it('returns any.required error when exportWeight is missing', () => {
		const payload = { ...basePayload, weights: [{ speciesId: 'COD' }] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const weightErr = error.details.find((d: any) => d.path.join('.') === 'weights.0.exportWeight');
		expect(weightErr).toBeDefined();
		expect(weightErr.type).toBe('any.required');
	});

	it('returns number.greater error when exportWeight is 0', () => {
		const payload = { ...basePayload, weights: [{ speciesId: 'COD', exportWeight: 0 }] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const weightErr = error.details.find((d: any) => d.path.join('.') === 'weights.0.exportWeight');
		expect(weightErr).toBeDefined();
		expect(weightErr.type).toBe('number.greater');
	});

	it('returns number.greater error when exportWeight is negative', () => {
		const payload = { ...basePayload, weights: [{ speciesId: 'COD', exportWeight: -10 }] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const weightErr = error.details.find((d: any) => d.path.join('.') === 'weights.0.exportWeight');
		expect(weightErr).toBeDefined();
		expect(weightErr.type).toBe('number.greater');
	});

	it('returns number.decimal-places error when exportWeight has more than 2 decimal places', () => {
		const payload = { ...basePayload, weights: [{ speciesId: 'COD', exportWeight: 100.123 }] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const weightErr = error.details.find((d: any) => d.path.join('.') === 'weights.0.exportWeight');
		expect(weightErr).toBeDefined();
		expect(weightErr.type).toBe('number.decimal-places');
	});

	it('passes validation with exportWeight at 2 decimal places', () => {
		const payload = { ...basePayload, weights: [{ speciesId: 'COD', exportWeight: 100.50 }] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('passes validation with exportWeight as whole number', () => {
		const payload = { ...basePayload, weights: [{ speciesId: 'COD', exportWeight: 100 }] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('passes validation with multiple weights', () => {
		const payload = {
			...basePayload,
			weights: [
				{ speciesId: 'COD', exportWeight: 100.50 },
				{ speciesId: 'HAD', exportWeight: 50.25 }
			]
		};
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});
});

describe('directLandingsSchema - weights total validation', () => {
	const payloadWithRequiredNoHighSeasFields = {
		...basePayload,
		highSeasArea: 'No',
		exclusiveEconomicZones: [{ officialCountryName: 'United Kingdom' }],
	};

	describe('when total export weight is within the valid limit', () => {
		it('does not return an array.totalWeightExceeded error for a single weight equal to the limit', () => {
			const payload = {
				...payloadWithRequiredNoHighSeasFields,
				weights: [{ speciesId: 'COD', exportWeight: 99999999999.99 }],
			};
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
			const weightError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
			);
			expect(weightError).toBeUndefined();
			const baseError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'exportWeight.directLanding.any.base',
			);
			expect(baseError).toBeUndefined();
		});

		it('does not return an array.totalWeightExceeded error when multiple weights total exactly the limit', () => {
			const payload = {
				...payloadWithRequiredNoHighSeasFields,
				weights: [
					{ speciesId: 'COD', exportWeight: 50000000000 },
					{ speciesId: 'HKE', exportWeight: 49999999999.99 },
				],
			};
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
			const weightError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
			);
			expect(weightError).toBeUndefined();
			const baseError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'exportWeight.directLanding.any.base',
			);
			expect(baseError).toBeUndefined();
		});

		it('does not return an array.totalWeightExceeded error for typical small weights', () => {
			const payload = {
				...payloadWithRequiredNoHighSeasFields,
				weights: [
					{ speciesId: 'COD', exportWeight: 100.5 },
					{ speciesId: 'HKE', exportWeight: 200 },
				],
			};
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
			const weightError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
			);
			expect(weightError).toBeUndefined();
			const baseError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'exportWeight.directLanding.any.base',
			);
			expect(baseError).toBeUndefined();
		});
	});

	describe('when total export weight exceeds 99,999,999,999.99', () => {
		it('returns an array.totalWeightExceeded error for a single weight above the limit', () => {
			const payload = {
				...payloadWithRequiredNoHighSeasFields,
				weights: [{ speciesId: 'COD', exportWeight: 100000000000 }],
			};
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
			const weightError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
			);
			expect(weightError).toBeDefined();
			expect(weightError?.path).toEqual(['weights']);
			expect(weightError?.type).toBe('array.totalWeightExceeded');
		});

		it('returns an array.totalWeightExceeded error when multiple weights combine to exceed the limit', () => {
			const payload = {
				...payloadWithRequiredNoHighSeasFields,
				weights: [
					{ speciesId: 'COD', exportWeight: 50000000000 },
					{ speciesId: 'HKE', exportWeight: 50000000000 },
				],
			};
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
			const weightError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
			);
			expect(weightError).toBeDefined();
			expect(weightError?.path).toEqual(['weights']);
			expect(weightError?.type).toBe('array.totalWeightExceeded');
		});

		it('returns an array.totalWeightExceeded error for the example values from the technical specification', () => {
			const payload = {
				...payloadWithRequiredNoHighSeasFields,
				weights: [
					{ speciesId: 'COD', exportWeight: 31111111334.52 },
					{ speciesId: 'HKE', exportWeight: 1000000000000040 },
				],
			};
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
			const weightError = error?.details.find(
				(d) => d.path[0] === 'weights' && d.type === 'array.totalWeightExceeded',
			);
			expect(weightError).toBeDefined();
		});

		it('includes other validation errors alongside the total weight error when abortEarly is false', () => {
			const payload = {
				...payloadWithRequiredNoHighSeasFields,
				weights: [{ speciesId: '', exportWeight: 100000000000 }],
			};
			const { error } = directLandingsSchema.validate(payload, { abortEarly: false, allowUnknown: true });
			const allTypes = error?.details.map((d) => d.type) ?? [];
			expect(allTypes).toContain('array.totalWeightExceeded');
			expect(allTypes).toContain('string.empty');
		});
	});
});

describe('directLandingsSchema - gear validation', () => {
	it('returns any.required error when gearCategory is missing', () => {
		const payload = { ...basePayload };
		delete payload.gearCategory;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const gearErr = error.details.find((d: any) => d.path.join('.') === 'gearCategory');
		expect(gearErr).toBeDefined();
		expect(gearErr.type).toBe('any.required');
	});

	it('returns any.required error when gearType is missing', () => {
		const payload = { ...basePayload };
		delete payload.gearType;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const gearErr = error.details.find((d: any) => d.path.join('.') === 'gearType');
		expect(gearErr).toBeDefined();
		expect(gearErr.type).toBe('any.required');
	});

	it('returns string.empty error when gearCategory is empty but gearType is provided', () => {
		const payload = { ...basePayload, gearCategory: '', gearType: 'Trawl' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const gearErr = error.details.find((d: any) => d.path.join('.') === 'gearCategory');
		expect(gearErr).toBeDefined();
		expect(gearErr.type).toBe('string.empty');
	});

	it('returns string.empty error when gearType is empty but gearCategory is provided', () => {
		const payload = { ...basePayload, gearCategory: 'Nets', gearType: '' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const gearErr = error.details.find((d: any) => d.path.join('.') === 'gearType');
		expect(gearErr).toBeDefined();
		expect(gearErr.type).toBe('string.empty');
	});

	it('passes validation with both gearCategory and gearType provided', () => {
		const payload = { ...basePayload, gearCategory: 'Nets', gearType: 'Trawl' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});
});

describe('directLandingsSchema - highSeasArea and EEZ validation', () => {
	it('returns any.required error when highSeasArea is missing', () => {
		const payload = { ...basePayload };
		delete payload.highSeasArea;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const highSeasErr = error.details.find((d: any) => d.path.join('.') === 'highSeasArea');
		expect(highSeasErr).toBeDefined();
		expect(highSeasErr.type).toBe('any.required');
	});

	it('passes validation when highSeasArea is Yes and exclusiveEconomicZones is missing', () => {
		const payload = { ...basePayload, highSeasArea: 'Yes' };
		delete payload.exclusiveEconomicZones;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('passes validation when highSeasArea is Yes and exclusiveEconomicZones is empty array', () => {
		const payload = { ...basePayload, highSeasArea: 'Yes', exclusiveEconomicZones: [] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('returns any.required error when highSeasArea is No and exclusiveEconomicZones is missing', () => {
		const payload = { ...basePayload, highSeasArea: 'No' };
		delete payload.exclusiveEconomicZones;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const eezErr = error.details.find((d: any) => d.path.join('.') === 'exclusiveEconomicZones');
		expect(eezErr).toBeDefined();
		expect(eezErr.type).toBe('any.required');
	});

	it('returns array.min error when highSeasArea is No and exclusiveEconomicZones is empty', () => {
		const payload = { ...basePayload, highSeasArea: 'No', exclusiveEconomicZones: [] };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeDefined();
		const eezErr = error.details.find((d: any) => d.path.join('.') === 'exclusiveEconomicZones');
		expect(eezErr).toBeDefined();
		expect(eezErr.type).toBe('array.min');
	});

	it('passes validation when highSeasArea is No and exclusiveEconomicZones has items', () => {
		const payload = {
			...basePayload,
			highSeasArea: 'No',
			exclusiveEconomicZones: [{ officialCountryName: 'United Kingdom' }]
		};
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});
});

describe('directLandingsSchema - rfmo validation', () => {
	it('passes validation when rfmo is missing (optional)', () => {
		const payload = { ...basePayload };
		delete payload.rfmo;
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});

	it('passes validation when rfmo is provided', () => {
		const payload = { ...basePayload, rfmo: 'NAFO' };
		const { error } = directLandingsSchema.validate(payload, { abortEarly: false });
		expect(error).toBeUndefined();
	});
});

describe('directLandingsSchema - nonJS error mode', () => {
	it('returns correct error keys for all required fields', () => {
		const errors = validateNonJs({});
		expect(errors).toBeDefined();
		expect(errors.dateLanded).toContain('error.dateLanded');
		expect(errors.startDate).toContain('error.startDate');
		expect(errors.faoArea).toContain('error.faoArea');
		expect(errors.vessel).toContain('error.vessel');
		expect(errors.weights).toContain('error.weights');
		expect(errors.gearCategory).toContain('error.gearCategory');
		expect(errors.gearType).toContain('error.gearType');
		expect(errors.highSeasArea).toContain('error.highSeasArea');
	});

	it('returns correct error key for dateLanded with empty part (fails moment validation)', () => {
		const payload = { ...basePayload, dateLanded: '2026--15' };
		const errors = validateNonJs(payload);
		expect(errors).toBeDefined();
		// '2026--15' passes the parts.every check but fails moment validation
		expect(errors.dateLanded).toContain('directLanding.date.invalid');
	});

	it('returns correct error key for invalid date', () => {
		const payload = { ...basePayload, dateLanded: '2026-02-31' };
		const errors = validateNonJs(payload);
		expect(errors).toBeDefined();
		expect(errors.dateLanded).toContain('directLanding.date.invalid');
	});

	it('returns correct error key for startDate after dateLanded', () => {
		const payload = { ...basePayload, dateLanded: '2026-02-10', startDate: '2026-02-15' };
		const errors = validateNonJs(payload);
		expect(errors).toBeDefined();
		expect(errors.startDate).toContain('date.max');
	});

	it('returns correct error key for invalid faoArea', () => {
		const payload = { ...basePayload, faoArea: 'INVALID' };
		const errors = validateNonJs(payload);
		expect(errors).toBeDefined();
		expect(errors.faoArea).toBe('error.faoArea.any.only');
	});

	it('returns correct error key for exportWeight with too many decimals', () => {
		const payload = { ...basePayload, weights: [{ speciesId: 'COD', exportWeight: 100.123 }] };
		const errors = validateNonJs(payload);
		expect(errors).toBeDefined();
		expect(errors['weights.0.exportWeight']).toContain('number.decimal-places');
	});

	it('returns correct error key for empty EEZ when highSeasArea is No', () => {
		const payload = { ...basePayload, highSeasArea: 'No', exclusiveEconomicZones: [] };
		const errors = validateNonJs(payload);
		expect(errors).toBeDefined();
		expect(errors.exclusiveEconomicZones).toContain('error.exclusiveEconomicZones');
	});
});
