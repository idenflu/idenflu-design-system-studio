import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Exercise the internal sizing algorithm without adding it to the public API.
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('../src/data-grid-sizing.ts', import.meta.url))],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const { resolveDataGridColumnWidths: widths, getDataGridColumnWidthBounds: bounds } =
  await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

test('fixed widths preserve defaults and px strings within column bounds', () => {
  assert.deepEqual(widths([
    {id:'default'},
    {id:'number',width:180},
    {id:'pixels',width:'240px'},
    {id:'numeric-string',width:'180'},
    {id:'minimum',width:120,minWidth:200},
    {id:'maximum',width:300,maxWidth:220},
  ], 1400), [160,180,240,180,200,220]);
});

test('percentage widths use the data viewport after the selection column', () => {
  assert.deepEqual(widths([
    {id:'quarter',width:'25%'},
    {id:'half',width:'50%'},
    {id:'fixed',width:120},
  ], 1000, {}, 52), [237,474,120]);
});

test('flex columns share remaining space in proportion to positive weights', () => {
  assert.deepEqual(widths([
    {id:'fixed',width:200},
    {id:'small',flex:1},
    {id:'large',flex:3},
  ], 1000), [200,200,600]);
});

test('flex takes precedence over a preferred width when a viewport is known', () => {
  assert.deepEqual(widths([
    {id:'fixed',width:200},
    {id:'fluid',width:'20%',flex:1,maxWidth:1000},
  ], 1000), [200,800]);
});

test('flex redistributes surplus when a column reaches its maximum', () => {
  assert.deepEqual(widths([
    {id:'fixed',width:100},
    {id:'capped',flex:1,maxWidth:150},
    {id:'remaining',flex:1,maxWidth:1000},
  ], 1000), [100,150,750]);
});

test('flex reserves minimum widths before distributing the remaining space', () => {
  assert.deepEqual(widths([
    {id:'fixed',width:100},
    {id:'minimum',flex:1,minWidth:250},
    {id:'weighted',flex:3,minWidth:50,maxWidth:1000},
  ], 600), [100,250,250]);
});

test('successive maximum constraints redistribute space without exceeding bounds', () => {
  assert.deepEqual(widths([
    {id:'fixed',width:100},
    {id:'first',flex:1,maxWidth:150},
    {id:'second',flex:2,maxWidth:250},
    {id:'remaining',flex:1,maxWidth:1000},
  ], 900), [100,150,250,400]);
});

test('simultaneous minimum and maximum constraints still fill feasible space', () => {
  assert.deepEqual(widths([
    {id:'fixed',width:100},
    {id:'minimum',flex:1,minWidth:300},
    {id:'maximum',flex:10,maxWidth:200},
    {id:'remaining',flex:1,maxWidth:1000},
  ], 700), [100,300,200,100]);
});

test('narrow viewports retain minimum widths and allow horizontal overflow', () => {
  assert.deepEqual(widths([
    {id:'fixed',width:200},
    {id:'first',flex:1,minWidth:100},
    {id:'second',flex:1,minWidth:100},
  ], 300), [200,100,100]);
});

test('wide viewports leave unused space when every flexible column is capped', () => {
  assert.deepEqual(widths([
    {id:'first',flex:1,maxWidth:200},
    {id:'second',flex:1,maxWidth:300},
  ], 1000), [200,300]);
});

test('manual resize overrides freeze one column while other flex columns adapt', () => {
  const columns = [{id:'fixed',width:200},{id:'resized',flex:1},{id:'fluid',flex:1}];
  assert.deepEqual(widths(columns,1000,{resized:300}), [200,300,500]);
  assert.deepEqual(widths(columns,800,{resized:300}), [200,300,300]);
  assert.deepEqual(widths(columns,1000,{resized:900}), [200,600,200]);
});

test('percentage columns recalculate on viewport resize while px columns stay fixed', () => {
  const columns = [{id:'percent',width:'50%'},{id:'fixed',width:120}];
  assert.deepEqual(widths(columns,800), [400,120]);
  assert.deepEqual(widths(columns,400), [200,120]);
});

test('fractional percentage allocations preserve the viewport total without a rounding scrollbar', () => {
  for (const percentages of [['50%','50%'],['33.333%','33.333%','33.333%']]) {
    const columns = percentages.map((width,index) => ({id:`percent-${index}`,width}));
    const resolved = widths(columns,701);
    assert.equal(resolved.reduce((sum,width) => sum + width,0),701);
    const ideal = 701 / percentages.length;
    assert.ok(resolved.every(width => Number.isInteger(width) && Math.abs(width - ideal) < 1));
  }
});

test('removing a visible column releases its space for the remaining flex columns', () => {
  const columns = [{id:'first',flex:1},{id:'second',flex:1},{id:'third',flex:1}];
  assert.deepEqual(widths(columns,900), [300,300,300]);
  assert.deepEqual(widths(columns.slice(1),900), [450,450]);
});

test('unmeasured and invalid viewports use preferred px widths for initial rendering', () => {
  const columns = [{id:'fixed',width:'200px',flex:1},{id:'percentage',width:'50%'},{id:'default',flex:2}];
  for (const viewport of [undefined,0,-1,NaN,Infinity]) {
    assert.deepEqual(widths(columns,viewport), [200,160,160]);
  }
});

test('invalid sizing options fall back to finite defaults', () => {
  assert.deepEqual(bounds({id:'invalid',minWidth:NaN,maxWidth:Infinity}), {min:96,max:600});
  assert.deepEqual(bounds({id:'inverted',minWidth:300,maxWidth:200}), {min:300,max:300});
  assert.deepEqual(widths([
    {id:'auto',width:'auto'},
    {id:'expression',width:'calc(50% - 20px)'},
    {id:'not-a-number',width:NaN},
    {id:'infinite',width:Infinity},
    {id:'zero-weight',flex:0},
    {id:'negative-weight',flex:-2},
    {id:'invalid-weight',flex:NaN},
    {id:'infinite-weight',flex:Infinity},
  ], 1600), Array(8).fill(160));
});

test('mixed percentages and flex honor selection space without mutating configuration', () => {
  const columns = Object.freeze([
    Object.freeze({id:'percentage',width:'25%'}),
    Object.freeze({id:'fixed',width:150}),
    Object.freeze({id:'fluid',flex:1,maxWidth:1000}),
  ]);
  const overrides = Object.freeze({fixed:200});
  assert.deepEqual(widths(columns,1052,overrides,52), [250,200,550]);
  assert.deepEqual(overrides,{fixed:200});
});

test('fractional flex shares remain bounded and account for available space', () => {
  const resolved = widths([{id:'one',flex:1},{id:'two',flex:1},{id:'three',flex:1}],1001,{},52);
  assert.equal(resolved.length,3);
  assert.ok(resolved.every(width => Number.isFinite(width) && width >= 316 && width <= 317));
  assert.ok(Math.abs(resolved.reduce((sum,width) => sum + width,0) - 949) <= 1);
  assert.deepEqual(widths([],1000),[]);
});

test('varied bounded allocations preserve whole-pixel totals and constraints', () => {
  let seed = 713;
  const next = maximum => {
    seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
    return seed % maximum;
  };
  for (let sample = 0; sample < 120; sample++) {
    const fixed = 96 + next(160);
    const available = 200 + next(1800);
    const flexible = Array.from({length:2 + next(5)},(_,index) => {
      const minWidth = 40 + next(160);
      return {id:`flex-${index}`,flex:1 + next(10),minWidth,maxWidth:minWidth + next(350)};
    });
    const columns = [{id:'fixed',width:fixed},...flexible];
    const resolved = widths(columns,available);
    const minimum = flexible.reduce((sum,column) => sum + column.minWidth,0);
    const maximum = flexible.reduce((sum,column) => sum + column.maxWidth,0);
    const expected = fixed + Math.max(minimum,Math.min(maximum,available - fixed));
    assert.equal(resolved.reduce((sum,width) => sum + width,0),expected,`total for sample ${sample}`);
    assert.equal(resolved[0],fixed);
    flexible.forEach((column,index) => {
      const width = resolved[index + 1];
      assert.ok(Number.isInteger(width) && width >= column.minWidth && width <= column.maxWidth,`bounds for sample ${sample}, ${column.id}`);
    });
  }
});
