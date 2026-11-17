import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
test("dashboard exposes all portfolio modules and mock-data boundaries",async()=>{const page=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");for(const label of ["经营总览","产品分析","门店分析","区域分析","数据质量","销售预测"])assert.ok(page.includes(label));assert.match(page,/模拟数据/);assert.match(page,/未连接外部业务数据源/);});
test("dashboard includes calculated metrics, CSV export and stateful alerts",async()=>{const page=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");assert.match(page,/products\.reduce/);assert.match(page,/daily=total\/month\.days/);assert.match(page,/URL\.createObjectURL/);assert.match(page,/setDone/);assert.match(page,/情景外推/);});
test("metadata and documentation describe the data boundary",async()=>{const layout=await readFile(new URL("../app/layout.tsx",import.meta.url),"utf8");const readme=await readFile(new URL("../README.md",import.meta.url),"utf8");assert.match(layout,/刘庆安/);assert.match(readme,/模拟数据/);assert.match(readme,/不连接任何外部业务系统/);});
