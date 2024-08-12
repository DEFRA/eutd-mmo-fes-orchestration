import { Schema, model } from 'mongoose';

const baseConfig = {
  collection: 'systemBlocks'
};

export const ValidationRules = Object.freeze(
  {
    THREE_C : 'CC_3c',
    THREE_D : 'CC_3d',
    FOUR_A : 'CC_4a',
    FOUR_B : 'PS_SD_4b'
  }
);

const BlockingStatusSchema = new Schema({
  name:          { type: String, required: true },
  status:        { type: Boolean, required: true },
}, baseConfig);

export const BlockingStatusModel = model('BlockingStatusModel', BlockingStatusSchema);

