import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("dashboard exposes all ten analytics modules and mock-data boundaries", async () => {
  const page = await read("../app/page.tsx");
  for (const label of ["经营总览", "产品分析", "门店分析", "区域分析", "数据质量", "销售预测", "利润分析", "用户分析", "库存分析", "渠道分析"]) {
    assert.ok(page.includes(label), `missing dashboard module: ${label}`);
  }
  assert.match(page, /模拟数据/);
  assert.match(page, /未连接外部业务数据源/);
});

test("dashboard includes calculated metrics, CSV export and stateful alerts", async () => {
  const page = await read("../app/page.tsx");
  assert.match(page, /products\.reduce/);
  assert.match(page, /daily=total\/month\.days/);
  assert.match(page, /URL\.createObjectURL/);
  assert.match(page, /setDone/);
  assert.match(page, /情景外推/);
  assert.match(page, /storeRows\.map/);
});

test("advanced modules disclose assumptions and cover unit economics, users, stock and channels", async () => {
  const advanced = await read("../app/advanced-analytics.tsx");
  for (const phrase of ["UNIT ECONOMICS", "CUSTOMER INTELLIGENCE", "INVENTORY & SUPPLY", "CHANNEL & CONVERSION", "演示假设", "并非真实仓储数据", "不代表真实埋点数据"]) {
    assert.ok(advanced.includes(phrase), `missing advanced analysis disclosure: ${phrase}`);
  }
  assert.match(advanced, /grossMargin/);
  assert.match(advanced, /inventoryDays/);
  assert.match(advanced, /channelMix/);
  assert.match(advanced, /funnel/);
});

test("metadata and documentation describe the expanded portfolio and data boundary", async () => {
  const layout = await read("../app/layout.tsx");
  const readme = await read("../README.md");
  assert.match(layout, /刘庆安/);
  for (const phrase of ["利润分析", "用户分析", "库存分析", "渠道分析", "模拟数据", "不连接任何外部业务系统"]) {
    assert.ok(readme.includes(phrase), `README missing: ${phrase}`);
  }
});
