import {serverTest} from '../testHelpers';

serverTest('[POST] /v1/transport/add (truck) should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/transport/add',
    headers: {accept: 'application/json'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      vehicle: 'truck'
    }
  });
  t.equals(response.statusCode, 200, 'Status code is 200');
});

serverTest('[POST] /v1/transport/add (unselected) should return 400', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/transport/add',
    headers: {accept: 'application/json'},
    app: {
      claims: {
        sub: '123456789'
      }
    }
  });
  t.equals(response.statusCode, 400, 'Status code is 400');
});

serverTest(
  '[POST] /v1/transport/add (truck - non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/add',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        vehicle: 'truck'
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest('[POST] /v1/transport/add (train - non JS) should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/transport/add',
    headers: {accept: 'text/html'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      vehicle: 'train'
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
});

serverTest('[POST] /v1/transport/add (plane - non JS) should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/transport/add',
    headers: {accept: 'text/html'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      vehicle: 'plane'
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
});

serverTest('[POST] /v1/transport/add (container vessel - non JS) should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/transport/add',
    headers: {accept: 'text/html'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      vehicle: 'containerVessel'
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
});

serverTest('[POST] /v1/transport/add (direct landing - non JS) should return 200', async (server, t) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/transport/add',
    headers: {accept: 'text/html'},
    app: {
      claims: {
        sub: '123456789'
      }
    },
    payload: {
      vehicle: 'directLanding'
    }
  });
  t.equals(response.statusCode, 302, 'Status code is 302');
});

serverTest(
  '[POST] /v1/transport/add (unselected non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/add',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/truck/cmr should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/cmr',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        cmr: 'true'
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest(
  '[POST] /v1/transport/truck/cmr should return 400',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/cmr',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 400, 'Status code is 400');
  }
);

serverTest(
  '[POST] /v1/transport/truck/cmr (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/cmr',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        cmr: 'true'
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/truck/cmr (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/cmr',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/truck/details should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        nationalityOfVehicle: 'French',
        registrationNumber: 'XX311YY',
        departurePlace: 'Calais'
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest(
  '[POST] /v1/transport/truck/details should return 400',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 400, 'Status code is 400');
  }
);

serverTest(
  '[POST] /v1/transport/truck/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        nationalityOfVehicle: 'French',
        registrationNumber: 'XX311YY',
        departurePlace: 'Calais'
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/truck/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/truck/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/train/details should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/train/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        stationName: 'Newcastle',
        railwayBillNumber: '123456',
        departurePlace: 'Calais'
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest(
  '[POST] /v1/transport/train/details should return 400',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/train/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 400, 'Status code is 400');
  }
);

serverTest(
  '[POST] /v1/transport/train/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/train/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        stationName: 'Newcastle',
        railwayBillNumber: '123456',
        departurePlace: 'Calais'
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/train/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/train/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/plane/details should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/plane/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        flightNumber: '123456',
        containerNumber: '987654',
        departurePlace: 'Paris'
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest(
  '[POST] /v1/transport/plane/details should return 400',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/plane/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 400, 'Status code is 400');
  }
);

serverTest(
  '[POST] /v1/transport/plane/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/plane/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        flightNumber: '123456',
        containerNumber: '987654',
        departurePlace: 'Paris'
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/plane/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/plane/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/containerVessel/details should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/containerVessel/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        vesselName: 'GOLDEN BELLS 11',
        flagState: 'P',
        containerNumber: '123456',
        departurePlace: 'Bordeaux'
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);

serverTest(
  '[POST] /v1/transport/containerVessel/details should return 400',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/containerVessel/details',
      headers: {accept: 'application/json'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 400, 'Status code is 400');
  }
);

serverTest(
  '[POST] /v1/transport/containerVessel/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/containerVessel/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      },
      payload: {
        vesselName: 'GOLDEN BELLS 11',
        flagState: 'P',
        containerNumber: '123456',
        departurePlace: 'Bordeaux'
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[POST] /v1/transport/containerVessel/details (non JS) should return 302',
  async (server, t) => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/transport/containerVessel/details',
      headers: {accept: 'text/html'},
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 302, 'Status code is 302');
  }
);

serverTest(
  '[GET] /v1/transport/details should return 200',
  async (server, t) => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/transport/details/catchCertificate',
      app: {
        claims: {
          sub: '123456789'
        }
      }
    });
    t.equals(response.statusCode, 200, 'Status code is 200');
  }
);
