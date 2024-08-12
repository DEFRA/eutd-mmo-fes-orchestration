import { Schema, Document, model } from 'mongoose';

export const baseConfig = {
  discriminationKey: '_type',
  collection: 'exportCertificates'
};

export type IBaseModel = Document;

export const BaseModel = model<IBaseModel>('BaseModel', new Schema({}, baseConfig));
