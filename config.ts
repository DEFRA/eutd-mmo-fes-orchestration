const conf = {
    auth: {
        // n.b this is going to be saved somewhere else, eventually
        username: 'demo',
        password: 'fishfishfish'
    },
    dataSources: {
                FishController: {
                    searchFish: 'https://mmo-export-catch-certificate-service.cloudapps.digital/search/species'
                }/*,
                PresentationStateController: {
                    getPS: 'https://mmo-export-catch-certificate-service.cloudapps.digital/species/<%= speciesFaoCode %>/state-and-presentation'
                }*/
    }
};

export default conf;