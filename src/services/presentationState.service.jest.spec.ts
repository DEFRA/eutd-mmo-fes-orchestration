import PresentationStateService from "./presentationState.service";
import * as mockData from "text!./../../mock_data/presentation_state/presentation_state.json";

describe("PresentationStateService", () => {
  it("getPS", async () => {
    const result = await PresentationStateService.getPS();

    expect(result).toEqual(mockData);
  });
});
