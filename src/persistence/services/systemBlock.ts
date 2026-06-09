import { BlockingStatusModel } from '../schema/systemBlock'

export const getBlockingStatus=  async (name: string) : Promise<boolean> => {
    const data : any = await BlockingStatusModel.findOne( {name} ).lean()

    return data ? data.status : false;
};

export const getBlockingStatuses = async (names: string[]): Promise<Map<string, boolean>> => {
    const results: any[] = await BlockingStatusModel.find({ name: { $in: names } });
    const statusMap = new Map<string, boolean>();
    for (const name of names) {
        const match = results.find((r: any) => r.name === name);
        statusMap.set(name, match ? match.status : false);
    }
    return statusMap;
};
