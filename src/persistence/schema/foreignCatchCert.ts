export interface IForeignCatchCertItem {
  species: string,
  totalWeight: number,
  allocatedWeight: number,
  createdByDocument: string
}

export interface IForeignCatchCert {
  certificateNumber: string,
  items: IForeignCatchCertItem[]
}

