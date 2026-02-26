import { Schema, model, Document } from 'mongoose';

export interface IProduct {
  id?: string;
  species: string;
  speciesCode: string;
  scientificName: string;
  state: string;
  stateLabel: string;
  presentation: string;
  presentationLabel: string;
  commodity_code: string;
  commodity_code_description: string;
}

interface IPrivacyStatementAttribute {
  name: string,
  value: boolean
}

interface IAttributeMeta {
  modifiedAt: string
}

// Any more supported attributes can be added as &
export type IAttribute = IAttributeMeta & IPrivacyStatementAttribute;

export type IFavourites = {
  products: IProduct[]
}

export interface IUserAttributes extends Document {
  userPrincipal: string,
  attributes: IAttribute[],
  favourites: IFavourites
}

const ProductsSchema = new Schema({
  id:                         { type: String },
  species:                    { type: String },
  speciesCode:                { type: String },
  scientificName:             { type: String },
  state:                      { type: String },
  stateLabel:                 { type: String },
  presentation:               { type: String },
  presentationLabel:          { type: String },
  commodity_code:             { type: String },
  commodity_code_description: { type: String },

}, { _id : false });

const FavouritesSchema = new Schema({
  products:       { type: [ProductsSchema] },
}, { _id : false });

const AttributeSchema = new Schema({
  name:       { type: String },
  value:      { type: Schema.Types.Mixed },
  modifiedAt: { type: Date }
}, { _id : false });

const UserAtrributesSchema = new Schema({
  userPrincipal:  { type: String },
  attributes:     { type: [AttributeSchema] },
  favourites:     { type: FavouritesSchema }
});

UserAtrributesSchema.index({ userPrincipal: 1 });

export const UserAttributesModel = model<IUserAttributes>('UserAttributesModel', UserAtrributesSchema, 'userAttributes');