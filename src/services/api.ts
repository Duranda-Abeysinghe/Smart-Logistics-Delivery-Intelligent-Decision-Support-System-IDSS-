import { LogisticsNode, LogisticsEdge, Vehicle, Driver, DeliveryOrder, InventoryItem } from '../types';

// Base URL of the ASP.NET Core backend. Override by setting VITE_API_BASE_URL
// in a .env file (e.g. VITE_API_BASE_URL=http://localhost:5222/api) to match
// whatever port `dotnet run` prints for your machine.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface NetworkDataResponse {
  nodes: LogisticsNode[];
  edges: LogisticsEdge[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: DeliveryOrder[];
  inventory: InventoryItem[];
}

/**
 * Fetches the full logistics dataset (locations, routes, vehicles, drivers,
 * orders, inventory) from the MySQL-backed API instead of relying on
 * hardcoded frontend constants.
 */
export async function fetchNetworkData(): Promise<NetworkDataResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard/network-data`);

  if (!response.ok) {
    throw new Error(`Failed to load logistics data from API (status ${response.status})`);
  }

  return response.json() as Promise<NetworkDataResponse>;
}
