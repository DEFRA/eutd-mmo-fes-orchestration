import * as moment from 'moment';

import { IUserAttributes, UserAttributesModel, IAttribute } from '../schema/userAttributes';

export const save = async (data: IUserAttributes): Promise<void> => {
  const conditions : any = {userPrincipal: data.userPrincipal};
  const options = {upsert: true, omitUndefined: true};
  await UserAttributesModel.findOneAndUpdate(conditions,data,options).lean(true);
};

export const find = async (userPrincipal: string, property?: string[]): Promise<IUserAttributes | null> => {
  return await UserAttributesModel.findOne({userPrincipal}).select(property).lean(true);
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
