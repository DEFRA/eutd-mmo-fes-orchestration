import * as test from 'tape';

import {  
  buildProducts,
  ExportPayload
} from '../../../src/persistence/adapters/catchCert';

/*
{
    "items": [
      
  };

*/

test('List of products should be built from list of species with landings', t => {
  const data = [
    {
      "product": {
        "commodityCode": "03036310",
        "presentation": {
          "code": "FIL",
          "label": "Filleted"
        },
        "state": {
          "code": "FRO",
          "label": "Frozen"
        },
        "species": {
          "code": "COD",
          "label": "Atlantic cod (COD)"
        }
      },
      "landings": [
        {
          "addMode": false,
          "editMode": false,
          "model": {
            "id": "99bc2947-c6f4-4012-9653-22dc0b9ad036",
            "vessel": {
              "pln": "B192",
              "vesselName": "GOLDEN BELLS 11",
              "homePort": "ARDGLASS",
              "registrationNumber": "A12186",
              "licenceNumber": "10106",
              "imoNumber": "9999990",
              "label": "GOLDEN BELLS 11 (B192)"
            },
            "dateLanded": "2019-01-29T00:00:00.000Z",
            "exportWeight": "22"
          }
        },
        {
          "addMode": false,
          "editMode": false,
          "model": {
            "id": "f487a7d8-76f9-4ff6-b40e-e511b19dfb91",
            "vessel": {
              "pln": "BCK126",
              "vesselName": "ZARA ANNABEL",
              "homePort": "UNKNOWN",
              "registrationNumber": "A23327",
              "licenceNumber": "42095",
              "imoNumber": "9999991",
              "label": "ZARA ANNABEL (BCK126)"
            },
            "dateLanded": "2019-01-30T00:00:00.000Z",
            "exportWeight": "23"
          }
        }
      ]
    }
  ];
  
  const products = buildProducts(data);
  t.equals(products.length, 1, 'Export one product');  
  t.equals(products[0].caughtBy.length, 2, 'Product is caught by 2 different landings');
  console.log(products);
  t.end();
});


test('List of products should be built from multiple list of species with landings', t => {
  const data = [
    {
      "product": {
        "commodityCode": "03036310",
        "presentation": {
          "code": "FIL",
          "label": "Filleted"
        },
        "state": {
          "code": "FRO",
          "label": "Frozen"
        },
        "species": {
          "code": "COD",
          "label": "Atlantic cod (COD)"
        }
      },
      "landings": [
        {
          "addMode": false,
          "editMode": false,
          "model": {
            "id": "99bc2947-c6f4-4012-9653-22dc0b9ad036",
            "vessel": {
              "pln": "B192",
              "vesselName": "GOLDEN BELLS 11",
              "homePort": "ARDGLASS",
              "registrationNumber": "A12186",
              "licenceNumber": "10106",
              "imoNumber": "9999990",
              "label": "GOLDEN BELLS 11 (B192)"
            },
            "dateLanded": "2019-01-29T00:00:00.000Z",
            "exportWeight": "22"
          }
        },
        {
          "addMode": false,
          "editMode": false,
          "model": {
            "id": "f487a7d8-76f9-4ff6-b40e-e511b19dfb91",
            "vessel": {
              "pln": "BCK126",
              "vesselName": "ZARA ANNABEL",
              "homePort": "UNKNOWN",
              "registrationNumber": "A23327",
              "licenceNumber": "42095",
              "imoNumber": "9999991",
              "label": "ZARA ANNABEL (BCK126)"
            },
            "dateLanded": "2019-01-30T00:00:00.000Z",
            "exportWeight": "23"
          }
        }
      ]
    },
    {
      "product": {
        "commodityCode": "03036400",
        "presentation": {
          "code": "FIL",
          "label": "Filleted"
        },
        "state": {
          "code": "FRO",
          "label": "Frozen"
        },
        "species": {
          "code": "HAD",
          "label": "Haddock (HAD)"
        }
      },
      "landings": [
        {
          "addMode": false,
          "editMode": false,
          "model": {
            "id": "f55dbc41-19f2-41c6-b047-8fcdae60601d",
            "vessel": {
              "pln": "AR190",
              "vesselName": "SILVER QUEST",
              "homePort": "TROON AND SALTCOATS",
              "registrationNumber": "A10726",
              "licenceNumber": "42384",
              "imoNumber": "9999992",
              "label": "SILVER QUEST (AR190)"
            },
            "dateLanded": "2019-01-22T00:00:00.000Z",
            "exportWeight": "55"
          }
        }
      ]
    }
  ];

  const products = buildProducts(data);
  t.equals(products.length, 2, 'Two export products');  
  t.equals(products[0].caughtBy.length, 2, '1st product is caught by 2 landings');
  t.equals(products[1].caughtBy.length, 1, '2nd product is caught by 1 landing');
  console.log(products);
  t.end();
});

