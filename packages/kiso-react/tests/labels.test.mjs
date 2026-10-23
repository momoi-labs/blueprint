import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BarGauge, Chart, ChartLegend, Meter, Progress } from '../dist/index.js';

const series = [{ key: 'user', label: 'Usuário' }];
const data = [{ timestamp: 1789203600000, values: { user: null } }];
const render = (component, props) => renderToStaticMarkup(createElement(component, props));

test('Chart renders its labels and passes the legend labels on', () => {
  const html = render(Chart, { label: 'CPU (%)', data, series, labels: {
    notCollected: 'Não coletado', empty: 'Nenhuma amostra coletada nesta janela.',
    timestamp: 'Horário', values: 'Ver valores exatos', help: 'Ajuda do gráfico.',
    summary: label => `${label}: resumo`, samples: label => `${label}: amostras em UTC`,
    series: 'Série', min: 'Mín', max: 'Máx', avg: 'Média', current: 'Atual',
  } });
  for (const text of ['Não coletado', 'Nenhuma amostra coletada nesta janela.', '<th scope="col">Horário</th>',
    'Ver valores exatos', 'Ajuda do gráfico.', 'CPU (%): resumo', 'CPU (%): amostras em UTC',
    '<th scope="col">Série</th>', '<th scope="col">Mín</th>', '<th scope="col">Máx</th>',
    '<th scope="col">Média</th>', '<th scope="col">Atual</th>']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /Not collected|No collected samples|Timestamp|View exact values|Focus the chart|: summary|>Series<|>Avg</);
});

test('ChartLegend renders percentile and inline labels', () => {
  const table = render(ChartLegend, { label: 'L', data, series, summary: ['p95'], labels: { p95: 'P95' } });
  assert.match(table, /<th scope="col">P95<\/th>/);
  const inline = render(ChartLegend, { label: 'L', data, series, variant: 'inline',
    labels: { current: 'Actual', notCollected: 'No recopilado' } });
  assert.match(inline, />Actual</);
  assert.match(inline, />No recopilado</);
});

test('BarGauge, Meter and Progress render their labels', () => {
  assert.match(render(BarGauge, { label: 'G', max: 10, rows: [], labels: { empty: 'Sem medições.' } }), />Sem medições.</);
  assert.match(render(BarGauge, { label: 'G', max: 10, rows: [{ key: 'a', label: 'A', value: null }],
    labels: { notCollected: 'Não coletado' } }), />Não coletado</);
  assert.match(render(Meter, { label: 'M', value: null, labels: { notCollected: 'Não coletado' } }), />Não coletado</);
  assert.match(render(Progress, { label: 'P', labels: { inProgress: 'Em andamento' } }), /Em andamento/);
});
