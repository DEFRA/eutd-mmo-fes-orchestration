const getMockLanding = (error = null, editMode = false, addMode = false, modelCopy = undefined, vessel = 'vessel',  dateLanded = '01-05-2019') => {
  return {
    error: error,
    model: {
      id: 1,
      vessel: vessel,
      dateLanded: dateLanded,
      exportWeight: 200,
      faoArea: 'area_01'
    },
    editMode,
    addMode,
    modelCopy
  }
};

const getMockItem = (landings) => {
  return {
    product: {
      id: 0,
      state: {
        label: 'FRO'
      },
      presentation: {
        label: 'FIL'
      },
      species: {
        label: 'COD'
      }
    },
    landings
  }
}


it('should be able to set the vessel name in the mock data', () => {

  const landings = [getMockLanding(null,  false,  false,  undefined,  'myvessel', '01-05-2019')]

  expect(landings[0].model.vessel).toEqual('myvessel')

})

it('should be able to create full mock object', () => {

  const landings = [getMockLanding(null,  false,  false,  undefined,  'myvessel', '01-05-2019')]

  const fish = getMockItem(landings)

  expect(fish.landings[0].model.vessel).toEqual('myvessel')

})