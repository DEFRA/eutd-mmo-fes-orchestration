import * as mockData from 'text!./../../mock_data/presentation_state/presentation_state.json';

export default class PresentationStateService {

  public static getPS(): Promise<object> {
    return new Promise((resolve) => {
      return resolve(mockData);
    });
  }

}
