import { BlockingStatusModel } from '../schema/systemBlock'

export const getBlockingStatus=  async (name: string) : Promise<boolean> => {
    const data : any = await BlockingStatusModel.findOne( {name} )

    return data ? data.status : false;
};
