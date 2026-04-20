import * as moment from 'moment';

import { IUserAttributes, UserAttributesModel, IAttribute } from '../schema/userAttributes';
import { SessionStoreFactory } from '../../session_store/factory';
import { getRedisOptions } from '../../session_store/redis';
import { USER_ATTRIBUTES_KEY } from '../../session_store/constants';

export const save = async (data: IUserAttributes): Promise<void> => {
  const conditions : any = {userPrincipal: data.userPrincipal};
  const options = {upsert: true, omitUndefined: true};
  await UserAttributesModel.findOneAndUpdate(conditions,data,options).lean(true);
};

export const find = async (userPrincipal: string, property?: string[]): Promise<IUserAttributes | null> => {
  if (!property) {
    try {
      const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
      const cached = await sessionStore.readFor<any>(userPrincipal, undefined, USER_ATTRIBUTES_KEY);
      if (cached) return cached as IUserAttributes;
    } catch {
      // cache unavailable — fall through to DB
    }
  }

  const result = await UserAttributesModel.findOne({userPrincipal}).select(property).lean(true);

  if (result && !property) {
    try {
      const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
      await (sessionStore as any).writeFor(userPrincipal, undefined, USER_ATTRIBUTES_KEY, result);
    } catch {
      // cache write failed — not critical
    }
  }

  return result;
};

export const saveOrUpdate = async(userPrincipal: string, attributeKey: string, attributeValue: any): Promise<IAttribute[]> => {
  const allUserAttributes = await find(userPrincipal, ["userPrincipal","attributes"]);
  let attributes: IAttribute[];

  if (allUserAttributes) {
    attributes = allUserAttributes.attributes;
    let foundAttribute = false;

    for(const attribute of attributes) {
      if (attribute.name === attributeKey) {
        foundAttribute = true;
        attribute.value = attributeValue;
        attribute.modifiedAt = moment.utc().toISOString();
      }
    }

    if (!foundAttribute) {
      attributes.push({
        name: attributeKey,
        value: attributeValue,
        modifiedAt: moment.utc().toISOString()
      });
    }

    await save(allUserAttributes);
  } else {
    attributes = [
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
  }

  try {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    await sessionStore.deleteFor(userPrincipal, undefined, USER_ATTRIBUTES_KEY);
  } catch {
    // cache invalidation failed — not critical
  }

  return attributes;
}
