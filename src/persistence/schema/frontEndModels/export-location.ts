import { ICountry } from '../common';

export interface ExportLocation {
  exportedFrom? : string;
  exportedTo : ICountry;
  pointOfDestination? : string;
}
