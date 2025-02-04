import applicationConfig from "../../applicationConfig";
import { IFavourites, IProduct, IUserAttributes } from "../schema/userAttributes";
import { find, save } from "./userAttributes";

export const readFavourites  = async (userPrincipal: string): Promise<IFavourites | null > => {
  const userAttributes =  await find(userPrincipal,["favourites"]);
  return userAttributes ? userAttributes.favourites : null
};

export const readFavouritesProducts = async (userPrincipal: string): Promise<IProduct[] | null> => {
  const favourites = await readFavourites(userPrincipal);
  return favourites? favourites.products : null;
};

export const canAddFavourite = async (userPrincipal: string): Promise<boolean> => {
  const favourites = await readFavouritesProducts(userPrincipal);

  return !favourites || favourites.length < applicationConfig._maximumFavouritesPerUser;
};

export const saveFavouritesProduct = async (userPrincipal: string, product: IProduct ): Promise<IProduct[]> => {
  let userAttributes = await find(userPrincipal);
  if (userAttributes) {
    if(!userAttributes.favourites?.products)  userAttributes.favourites = {products : []};
    if(productAlreadyExist(product, userAttributes.favourites.products)) {
      return null;
    } else {
      product.id = generateFavouriteId(userAttributes.favourites.products.map(p => p.id));
      userAttributes.favourites.products.push(product) ;
    }
  } else {
    userAttributes = {
      userPrincipal,
      attributes: [],
      favourites: {
        products: [
          {
            ...product,
            id: generateFavouriteId([])
          }
        ]
      }
    } as unknown as IUserAttributes;
  }
  await save(userAttributes);
  return userAttributes.favourites.products;
};

export const generateFavouriteId = (existingIds: string[]) => {
  let id;

  do {
    id = 'PRD' + `${Math.floor(Math.random() * 999) + 1}`.padStart(3, '0');
  }
  while (existingIds.includes(id));

  return id;
};

export const productAlreadyExist = (product: IProduct, products: IProduct[]): boolean => {
  return products.map(_p => _p.commodity_code+_p.speciesCode+_p.presentation+_p.state)
    .includes(product.commodity_code+product.speciesCode+product.presentation+product.state)
};

export const deleteFavouritesProduct = async (userPrincipal: string, productId: string): Promise<IProduct[] | null> => {
  const userAttributes = await find(userPrincipal);
  if(userAttributes?.favourites?.products?.length) {
    const newUseAttributes = {...userAttributes} as IUserAttributes;
    newUseAttributes.favourites.products =  userAttributes.favourites.products.filter(prd => prd.id != productId);
    await save(newUseAttributes);
    return newUseAttributes.favourites.products;
  } else {
    return null;
  }
};
