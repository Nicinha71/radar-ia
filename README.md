# Radar IA Produtos — MVP 0.2

Versão utilizável com Mercado Livre e Google Trends.

## Funções incluídas

- Pesquisa ao vivo de produtos no Mercado Livre.
- Resultados, preço médio, mediano, mínimo e máximo.
- Percentual de anúncios com frete grátis.
- Dispersão de preços.
- Concorrência e score preliminar.
- Extração de palavras recorrentes dos títulos.
- Sugestões de novas pesquisas.
- Lista oficial de tendências do Mercado Livre.
- Comparação de até cinco termos no Google Trends.
- Calculadora de lucro, margem e ROI.
- Interface responsiva.

## Rodar localmente

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Observação sobre Google Trends

A API oficial do Google Trends ainda possui acesso restrito. O aplicativo cria a comparação pronta no site oficial, sem inventar números ou depender de bibliotecas não oficiais.

## Próximas funções

- Histórico permanente.
- Favoritos.
- Snapshots de tendência.
- Importação de CSV do Google Trends.
- Análise de catálogo por link.
- Briefing para agente externo.


## Novidades da versão 0.3
- Semáforo Testar / Analisar / Evitar.
- Estimativa de saturação.
- Estimativa de guerra de preços.
- Faixa central pelo preço mediano.
- Gerador de Radar Intelligence Package.
- Campos de loja, benefícios, público e dor.
- Briefing pronto para copiar e usar em agente externo.
