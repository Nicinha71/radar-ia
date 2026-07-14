import type { SearchSummary, TrendsResponse } from "./types";

async function readError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
  return payload.detail || "Não foi possível concluir a consulta.";
}

export async function searchProducts(query: string): Promise<SearchSummary> {
  const response = await fetch(`/api/v1/marketplace/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function loadMarketplaceTrends(): Promise<TrendsResponse> {
  const response = await fetch("/api/v1/marketplace/trends");
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}
