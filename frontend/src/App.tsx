import { useMemo, useState } from "react";
import { loadMarketplaceTrends, searchProducts } from "./api";
import { MetricCard } from "./components/MetricCard";
import { SearchBar } from "./components/SearchBar";
import type { SearchSummary, TrendItem } from "./types";

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Tab = "pesquisa" | "tendencias" | "comparador" | "financeiro" | "briefing";

export default function App() {
  const [tab, setTab] = useState<Tab>("pesquisa");
  const [result, setResult] = useState<SearchSummary | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");
  const [trendFilter, setTrendFilter] = useState("");
  const [compareTerms, setCompareTerms] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeBenefits, setStoreBenefits] = useState("Envio em até 24 horas úteis, bons produtos e boa reputação.");
  const [productBenefits, setProductBenefits] = useState("");
  const [audience, setAudience] = useState("");
  const [pain, setPain] = useState("");
  const [financial, setFinancial] = useState({
    sale: 59.9, cost: 25, supplierFee: 0, mlPercent: 14,
    fixed: 6, tax: 6, returns: 4, ads: 0
  });

  async function run(query: string) {
    setLoading(true);
    setError("");
    try {
      setResult(await searchProducts(query));
      setTab("pesquisa");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Falha inesperada.");
    } finally {
      setLoading(false);
    }
  }

  async function getTrends() {
    setTrendLoading(true);
    setError("");
    try {
      const data = await loadMarketplaceTrends();
      setTrends(data.items);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Falha inesperada.");
    } finally {
      setTrendLoading(false);
    }
  }

  const visibleTrends = useMemo(
    () => trends.filter(item => item.keyword.toLowerCase().includes(trendFilter.toLowerCase())),
    [trends, trendFilter]
  );

  function googleTrendsUrl() {
    const terms = compareTerms.split(",").map(term => term.trim()).filter(Boolean).slice(0, 5);
    if (!terms.length) return "";
    return `https://trends.google.com/trends/explore?geo=BR&date=today%203-m&q=${terms.map(encodeURIComponent).join(",")}`;
  }

  const fees = financial.sale * (
    financial.mlPercent + financial.tax + financial.returns
  ) / 100;
  const profit = financial.sale - financial.cost - financial.supplierFee -
    financial.fixed - financial.ads - fees;
  const margin = financial.sale ? profit / financial.sale * 100 : 0;
  const roi = financial.cost ? profit / financial.cost * 100 : 0;

  const saturation = result ? (result.total < 800 ? "Baixa" : result.total < 5000 ? "Média" : result.total < 20000 ? "Alta" : "Muito alta") : "—";
  const priceWar = result ? (result.price_spread_percent > 140 ? "Alta" : result.price_spread_percent > 80 ? "Média" : "Baixa") : "—";
  const recommendation = result ? (result.preliminary_score >= 75 ? "TESTAR" : result.preliminary_score >= 55 ? "ANALISAR" : "EVITAR") : "—";
  const briefing = result ? `RADAR INTELLIGENCE PACKAGE

PRODUTO: ${result.query}
LOJA: ${storeName || "[informar nome da loja]"}
BENEFÍCIOS DA LOJA: ${storeBenefits}
BENEFÍCIOS DO PRODUTO: ${productBenefits || "[confirmar benefícios reais]"}
PÚBLICO: ${audience || "[identificar público]"}
DOR PRINCIPAL: ${pain || "[identificar dor]"}

DADOS DO MERCADO LIVRE
Resultados: ${result.total}
Preço médio: ${money(result.average_price)}
Preço mediano: ${money(result.median_price)}
Frete grátis: ${result.free_shipping_percent}%
Concorrência: ${result.competition_level}
Saturação: ${saturation}
Guerra de preços: ${priceWar}
Score preliminar: ${result.preliminary_score}/100
Recomendação: ${recommendation}

PALAVRAS RECORRENTES
${result.recurrent_keywords.map(k => `- ${k.term} (${k.count})`).join("\n")}

INSTRUÇÕES AO AGENTE
1. Gere 5 títulos fortes com até 60 caracteres.
2. Use o máximo útil do limite, sem repetições artificiais.
3. Gere descrição persuasiva focada na dor e transformação.
4. Gere 2 parágrafos sobre os benefícios da loja.
5. Gere 2 parágrafos sobre os benefícios do produto.
6. Gere bullets, FAQ, objeções e roteiro de imagens.
7. Não invente características não confirmadas.` : "";

  function copyBriefing() {
    if (!briefing) return;
    navigator.clipboard.writeText(briefing);
    alert("Briefing copiado.");
  }

  return (
    <div>
      <header className="topbar">
        <div className="brand-mark">R</div>
        <div><strong>Radar IA Produtos</strong><small>Mercado Livre + Google Trends</small></div>
      </header>

      <nav className="tabs">
        {[
          ["pesquisa", "Pesquisa ML"],
          ["tendencias", "Tendências ML"],
          ["comparador", "Google Trends"],
          ["financeiro", "Viabilidade"],
          ["briefing", "Briefing IA"]
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""}
            onClick={() => setTab(id as Tab)}>{label}</button>
        ))}
      </nav>

      <main>
        {error && <div className="error-box">{error}</div>}

        {tab === "pesquisa" && (
          <>
            <SearchBar loading={loading} onSearch={run} />
            {!result && <div className="welcome-note">Pesquise um produto para analisar preços, palavras recorrentes, frete e concorrência.</div>}
            {result && (
              <>
                <section className="metrics-grid">
                  <MetricCard label="Resultados" value={result.total.toLocaleString("pt-BR")} />
                  <MetricCard label="Preço médio" value={money(result.average_price)} />
                  <MetricCard label="Preço mediano" value={money(result.median_price)} />
                  <MetricCard label="Frete grátis" value={`${result.free_shipping_percent}%`} />
                  <MetricCard label="Score preliminar" value={`${result.preliminary_score}/100`}
                    help={`Concorrência ${result.competition_level}`} />
                </section>

                <section className="insight-grid">
                  <article className="card insight-card"><span>Semáforo</span><strong className={`signal ${recommendation.toLowerCase()}`}>{recommendation}</strong><small>Com base nos dados públicos atuais.</small></article>
                  <article className="card insight-card"><span>Saturação</span><strong>{saturation}</strong><small>Estimativa pela quantidade de resultados.</small></article>
                  <article className="card insight-card"><span>Guerra de preços</span><strong>{priceWar}</strong><small>Estimativa pela dispersão dos preços.</small></article>
                  <article className="card insight-card"><span>Faixa central</span><strong>{money(result.median_price)}</strong><small>Referência mais resistente a extremos.</small></article>
                </section>

                <section className="content-grid">
                  <article className="card">
                    <div className="section-heading">
                      <div><span className="eyebrow">Dados atuais</span><h2>Anúncios encontrados</h2></div>
                      <span className="status">Dispersão {result.price_spread_percent}%</span>
                    </div>
                    <div className="product-list">
                      {result.items.slice(0, 20).map(item => (
                        <a className="product-row" href={item.permalink} target="_blank"
                          rel="noreferrer" key={item.id}>
                          <img src={item.thumbnail || ""} alt="" />
                          <div className="product-info">
                            <strong>{item.title}</strong>
                            <span>{item.seller_nickname || "Vendedor não informado"}</span>
                          </div>
                          <div className="product-price">
                            <strong>{money(item.price)}</strong>
                            <span>{item.free_shipping ? "Frete grátis" : "Frete a consultar"}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </article>

                  <aside className="side-stack">
                    <section className="card">
                      <span className="eyebrow">SEO observado</span>
                      <h2>Palavras recorrentes</h2>
                      <div className="chips">
                        {result.recurrent_keywords.map(keyword => (
                          <button className="chip" key={keyword.term}
                            onClick={() => run(`${result.query} ${keyword.term}`)}>
                            {keyword.term} <b>{keyword.count}</b>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="card">
                      <span className="eyebrow">Novas pesquisas</span>
                      <h2>Variações sugeridas</h2>
                      <div className="suggestion-list">
                        {result.suggested_searches.slice(0, 6).map(suggestion => (
                          <button key={suggestion} onClick={() => run(suggestion)}>
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </section>
                  </aside>
                </section>
              </>
            )}
          </>
        )}

        {tab === "tendencias" && (
          <section className="card">
            <div className="section-heading">
              <div><span className="eyebrow">Atualização oficial</span><h1>Tendências do Mercado Livre</h1></div>
              <button className="primary" onClick={getTrends} disabled={trendLoading}>
                {trendLoading ? "Atualizando..." : "Atualizar agora"}
              </button>
            </div>
            <input className="filter-input" value={trendFilter}
              onChange={event => setTrendFilter(event.target.value)}
              placeholder="Filtrar uma tendência" />
            {!trends.length ? (
              <div className="welcome-note">Clique em atualizar para carregar os termos mais procurados.</div>
            ) : (
              <div className="trend-grid">
                {visibleTrends.map(item => (
                  <article className="trend-card" key={`${item.rank}-${item.keyword}`}>
                    <span>#{item.rank}</span><strong>{item.keyword}</strong>
                    <button onClick={() => run(item.keyword)}>Analisar no ML</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "comparador" && (
          <section className="card">
            <span className="eyebrow">Interesse fora do marketplace</span>
            <h1>Comparar no Google Trends</h1>
            <p>Digite até cinco termos separados por vírgula. A consulta será aberta no Google Trends para o Brasil e últimos 90 dias.</p>
            <textarea value={compareTerms} onChange={event => setCompareTerms(event.target.value)}
              placeholder="Ex.: escova pet, tira pelos, removedor de pelos" />
            <div className="action-row">
              <a className={`link-button ${googleTrendsUrl() ? "" : "disabled"}`}
                href={googleTrendsUrl() || undefined} target="_blank" rel="noreferrer">
                Abrir comparação atualizada
              </a>
              {result && <button className="secondary"
                onClick={() => setCompareTerms(result.query)}>Usar produto pesquisado</button>}
            </div>
            <div className="info-grid">
              <article><strong>Interesse no tempo</strong><span>Veja se a procura cresce, cai ou é sazonal.</span></article>
              <article><strong>Regiões</strong><span>Descubra estados com maior interesse relativo.</span></article>
              <article><strong>Consultas relacionadas</strong><span>Encontre termos em ascensão e variações.</span></article>
              <article><strong>Até 5 comparações</strong><span>Compare nomes, sinônimos e tipos de produto.</span></article>
            </div>
          </section>
        )}

        {tab === "financeiro" && (
          <section className="finance-grid">
            <article className="card">
              <span className="eyebrow">Evitar prejuízo</span><h1>Viabilidade financeira</h1>
              <div className="form-grid">
                {[
                  ["sale","Preço de venda"],["cost","Custo do fornecedor"],
                  ["supplierFee","Frete/taxa do fornecedor"],["mlPercent","Tarifa ML (%)"],
                  ["fixed","Custo fixo"],["tax","Impostos (%)"],
                  ["returns","Reserva devoluções (%)"],["ads","Anúncio por venda"]
                ].map(([key,label]) => (
                  <label key={key}>{label}
                    <input type="number" step="0.01"
                      value={financial[key as keyof typeof financial]}
                      onChange={event => setFinancial({...financial,
                        [key]: Number(event.target.value)})} />
                  </label>
                ))}
              </div>
            </article>
            <aside className="card result-card">
              <span className="eyebrow">Resultado estimado</span>
              <strong className="big-profit">{money(profit)}</strong>
              <span>Lucro líquido por venda</span>
              <div className="result-line"><span>Margem líquida</span><b>{margin.toFixed(1)}%</b></div>
              <div className="result-line"><span>ROI sobre custo</span><b>{roi.toFixed(1)}%</b></div>
              <div className={`verdict ${profit >= 12 && margin >= 20 ? "good" : profit > 0 ? "warn" : "bad"}`}>
                {profit >= 12 && margin >= 20 ? "Bom para teste" :
                  profit > 0 ? "Margem apertada" : "Operação com prejuízo"}
              </div>
            </aside>
          </section>
        )}

        {tab === "briefing" && (
          <section className="brief-grid">
            <article className="card">
              <span className="eyebrow">Dados confirmados</span>
              <h1>Preparar anúncio para o agente externo</h1>
              <div className="form-grid">
                <label>Nome da loja<input value={storeName} onChange={e => setStoreName(e.target.value)} /></label>
                <label>Benefícios da loja<input value={storeBenefits} onChange={e => setStoreBenefits(e.target.value)} /></label>
                <label>Benefícios reais do produto<input value={productBenefits} onChange={e => setProductBenefits(e.target.value)} /></label>
                <label>Público principal<input value={audience} onChange={e => setAudience(e.target.value)} /></label>
                <label>Dor principal<input value={pain} onChange={e => setPain(e.target.value)} /></label>
              </div>
            </article>
            <aside className="card">
              <span className="eyebrow">Radar Intelligence Package</span>
              <h2>Briefing pronto para copiar</h2>
              {result ? <><textarea className="briefing-output" readOnly value={briefing} /><button className="primary full" onClick={copyBriefing}>Copiar briefing</button></> : <div className="welcome-note">Pesquise um produto primeiro.</div>}
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
