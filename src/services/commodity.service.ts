import * as jsonfile from 'jsonfile';

const filePath = './mock_data/commodity_code/commodity_code.json';

export default class CatchService {

  private static getCC(howMany: number): Promise<object[]> {
    const result = [];
    return new Promise((resolve, reject) => {
      jsonfile.readFile(filePath, (e, data) => {
        if (e) {
          return reject(new Error('Cannot readAll commodity codes'));
        }
        for (let i = 0; i < howMany; i++) {
          result.push(data[Math.floor(Math.random() * data.length)]);
        }
        return resolve(Array.from(new Set(result)));
      });
    });
  }

  public static async searchCC() {
    // for now at least it's random, but then it will have to be by species / presentation_state
    const ccToReturn = 3;
    return await CatchService.getCC(ccToReturn);
  }

}