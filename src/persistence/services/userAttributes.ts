import * as moment from 'moment';

import { IUserAttributes, UserAttributesModel, IAttribute } from '../schema/userAttributes';

const FIND_CACHE_TTL_MS = 5000;

type FindCacheEntry = {
  expiresAt: number;
  value: IUserAttributes | null;
};

const findCache = new Map<string, FindCacheEntry>();

const getFindCacheKey = (userPrincipal: string, property?: string[]): string => {
  const projection = Array.isArray(property) ? [...property].sort().join(',') : '*';
  return `${userPrincipal}|${projection}`;
};

const invalidateUserCache = (userPrincipal: string): void => {
  for (const key of findCache.keys()) {
    if (key.startsWith(`${userPrincipal}|`)) {
      findCache.delete(key);
    }
  }
};

export const clearFindCacheForTests = (): void => {
  findCache.clear();
};

export const save = async (data: IUserAttributes): Promise<void> => {
  const conditions : any = {userPrincipal: data.userPrincipal};
  const options = {upsert: true, omitUndefined: true};
  await UserAttributesModel.findOneAndUpdate(conditions,data,options).lean(true);
  invalidateUserCache(data.userPrincipal);
};

export const find = async (userPrincipal: string, property?: string[]): Promise<IUserAttributes | null> => {
  const key = getFindCacheKey(userPrincipal, property);
  const now = Date.now();
  const cacheHit = findCache.get(key);

  if (cacheHit && cacheHit.expiresAt > now) {
    return cacheHit.value;
  }

  const value = await UserAttributesModel.findOne({userPrincipal}).select(property).lean(true);

  findCache.set(key, {
    expiresAt: now + FIND_CACHE_TTL_MS,
    value,
  });

  return value;
};

export const saveOrUpdate = async(userPrincipal: string, attributeKey: string, attributeValue: any): Promise<IAttribute[]> => {
  const allUserAttributes = await find(userPrincipal, ["userPrincipal","attributes"]);
  if (allUserAttributes) {
    const attributes = allUserAttributes.attributes;
    let foundAttribute = false;

    for(const attribute of attributes) {
      if (attribute.name === attributeKey) {
        // found attribute in list of attributes - just update it and return
        foundAttribute = true;
        attribute.value = attributeValue;
        attribute.modifiedAt = moment.utc().toISOString();
      }
    }

    if (!foundAttribute) {

      // cannot find attribute - add it as a new attribute.
      attributes.push({
        name: attributeKey,
        value: attributeValue,
        modifiedAt: moment.utc().toISOString()
      });
    }

    await save(allUserAttributes);

    return attributes;

  } else {
    const attributes = [
      {
        name: attributeKey,
        value: attributeValue,
        modifiedAt: moment.utc().toISOString()
      }
    ];

    const data = {
      userPrincipal,
      attributes,
      favourites : { products:[]}
    } as IUserAttributes;

    await save(data);
    return attributes;
  }
}
