"use client";

import { useMemo, useState } from "react";

type View = "update" | "overview" | "products" | "stores" | "regions" | "launch" | "alerts" | "forecast";
type ProductSeed = { name: string; baseSales: number; storeCount: number; trend: number };

const monthOptions = [
  { label: "2026年08月", factor: 1, days: 12, partial: true },
  { label: "2026年07月", factor: .94, days: 31, partial: false },
  { label: "2026年06月", factor: .87, days: 30, partial: false },
];

const brands = [
  { name: "品牌 A", scale: 1, stores: 486, sku: 43, growth: 12.8, target: 2011717 },
  { name: "品牌 B", scale: .58, stores: 218, sku: 38, growth: 8.6, target: 598513 },
  { name: "品牌 C", scale: .21, stores: 72, sku: 31, growth: 16.4, target: 176300 },
  { name: "品牌 D", scale: .16, stores: 58, sku: 27, growth: 11.2, target: 132200 },
  { name: "品牌 E", scale: .12, stores: 41, sku: 24, growth: 19.7, target: 98800 },
];

const productSeeds: ProductSeed[] = [
  { name: "大红袍珍珠奶茶", baseSales: 184260, storeCount: 392, trend: 18.2 },
  { name: "茉莉轻乳茶", baseSales: 147830, storeCount: 368, trend: 12.6 },
  { name: "鸭屎香柠檬茶", baseSales: 126440, storeCount: 341, trend: 8.4 },
  { name: "锡兰红茶拿铁", baseSales: 98620, storeCount: 315, trend: -2.1 },
  { name: "桂花乌龙鲜奶茶", baseSales: 75480, storeCount: 286, trend: 6.7 },
  { name: "青提茉莉冰茶", baseSales: 63140, storeCount: 254, trend: 21.5 },
];

const storeSeeds = [
  { name: "门店 A", code: "S1001", weight: .28 },
  { name: "门店 B", code: "S1002", weight: .24 },
  { name: "门店 C", code: "S1003", weight: .20 },
  { name: "门店 D", code: "S1004", weight: .16 },
  { name: "门店 E", code: "S1005", weight: .12 },
];

const navItems: { id: View; label: string; hint: string }[] = [
  { id: "update", label: "自动任务", hint: "采集与更新" },
  { id: "overview", label: "数据总览", hint: "经营指标" },
  { id: "products", label: "产品月度", hint: "产品 → 门店" },
  { id: "stores", label: "门店排名", hint: "门店 → 产品" },
  { id: "regions", label: "区域经营", hint: "区域对比" },
  { id: "launch", label: "产品看板", hint: "自定义生成" },
  { id: "alerts", label: "异常监控", hint: "预警与确认" },
  { id: "forecast", label: "销售预测", hint: "月底预估" },
];

function formatInt(value: number) {
  return Math.round(value).toLocaleString("zh-CN");
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [brandIndex, setBrandIndex] = useState(0);
  const [monthIndex, setMonthIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState("最近一次自动更新已完成");
  const [confirmedUpdate, setConfirmedUpdate] = useState(false);
  const [handledAlerts, setHandledAlerts] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("华北区域");
  const [forecastMode, setForecastMode] = useState("基准");
  const [launchProduct, setLaunchProduct] = useState(productSeeds[0].name);
  const [launchDate, setLaunchDate] = useState("2026-07-01");
  const [target, setTarget] = useState(260000);
  const [generated, setGenerated] = useState(true);

  const brand = brands[brandIndex];
  const month = monthOptions[monthIndex];
  const products = useMemo(() => productSeeds.map((seed, index) => {
    const sales = Math.round(seed.baseSales * brand.scale * month.factor);
    const storeCount = Math.max(18, Math.round(seed.storeCount * Math.min(1, brand.scale + .12)));
    const stores = storeSeeds.map((store, storeIndex) => ({
      ...store,
      sales: Math.round(sales * store.weight),
      daily: sales * store.weight / month.days,
      contribution: store.weight,
      rank: storeIndex + 1,
    }));
    return {
      ...seed,
      rank: index + 1,
      sales,
      storeCount,
      usd: sales / storeCount / month.days,
      trend: seed.trend + brandIndex * 1.2 - monthIndex * 1.6,
      stores,
    };
  }), [brand, brandIndex, month, monthIndex]);

  const storeRows = useMemo(() => storeSeeds.map((store, index) => {
    const storeProducts = products.map((product) => ({
      name: product.name,
      sales: product.stores[index].sales,
      daily: product.stores[index].daily,
    })).sort((a, b) => b.sales - a.sales);
    const sales = storeProducts.reduce((sum, item) => sum + item.sales, 0);
    return { ...store, rank: index + 1, sales, daily: sales / month.days, sku: storeProducts.length, products: storeProducts };
  }), [products, month.days]);

  const visibleProducts = products.filter((item) => item.name.includes(query.trim()));
  const visibleStores = storeRows.filter((item) => `${item.name}${item.code}`.toLowerCase().includes(query.trim().toLowerCase()));
  const totalSales = Math.round(7826222 * brand.scale * month.factor);
  const progress = totalSales / brand.target;

  function switchView(next: View) {
    setView(next);
    setQuery("");
    setExpandedProduct(null);
    setExpandedStore(null);
  }

  function simulateImport() {
    if (importing) return;
    setImporting(true);
    setConfirmedUpdate(false);
    setImportMessage("正在连接业务数据源…");
    setImportProgress(18);
    window.setTimeout(() => { setImportMessage("正在增量拉取销售、门店与 SKU 数据…"); setImportProgress(44); }, 650);
    window.setTimeout(() => { setImportMessage("正在执行日期完整性与异常波动校验…"); setImportProgress(72); }, 1250);
    window.setTimeout(() => { setImportMessage("更新完成：新增 128,640 行，发现 3 项待确认变化"); setImportProgress(100); setImporting(false); }, 2050);
  }

  function exportProducts() {
    downloadCsv(`${brand.name}_${month.label}_产品销售.csv`, [
      ["排名", "产品", "销售杯数", "售卖门店数", "USD", "同比"],
      ...visibleProducts.map((item) => [item.rank, item.name, item.sales, item.storeCount, item.usd.toFixed(2), `${item.trend.toFixed(1)}%`]),
    ]);
  }

  function exportStores() {
    downloadCsv(`${brand.name}_${month.label}_门店排名.csv`, [
      ["排名", "门店", "门店编码", "销售杯数", "售卖产品数", "日均杯数"],
      ...visibleStores.map((item) => [item.rank, item.name, item.code, item.sales, item.sku, item.daily.toFixed(2)]),
    ]);
  }

  const launchResult = products.find((item) => item.name === launchProduct) ?? products[0];
  const launchDays = Math.max(1, Math.round((new Date("2026-08-12").getTime() - new Date(launchDate).getTime()) / 86400000) + 1);
  const launchSales = Math.round(launchResult.sales * 1.62);
  const regionRows = [
    { name: "华北区域", sales: totalSales * .31, stores: Math.round(brand.stores * .28), growth: 14.8, usd: 13.72 },
    { name: "华东区域", sales: totalSales * .27, stores: Math.round(brand.stores * .25), growth: 9.6, usd: 12.94 },
    { name: "华南区域", sales: totalSales * .19, stores: Math.round(brand.stores * .18), growth: 21.3, usd: 14.16 },
    { name: "华中区域", sales: totalSales * .14, stores: Math.round(brand.stores * .16), growth: 4.2, usd: 10.88 },
    { name: "西南区域", sales: totalSales * .09, stores: Math.round(brand.stores * .13), growth: -1.7, usd: 8.94 },
  ];
  const alerts = [
    { id: "A01", level: "高", title: "门店 C 销量突降 36%", detail: "较近 7 日均值明显下降，建议核对营业状态或数据回传。", time: "08:42" },
    { id: "A02", level: "高", title: "2026-08-11 缺少 2 家门店数据", detail: "自动任务已重试 2 次，仍未收到门店 S1042、S1088 明细。", time: "07:18" },
    { id: "A03", level: "中", title: "发现 4 个未映射 SKU", detail: "系统已使用名称规则临时归类，等待补充标准 SKU 对照。", time: "06:51" },
    { id: "A04", level: "低", title: "品牌 B 新增 3 家门店", detail: "门店主数据已同步，需确认是否计入本月活跃门店口径。", time: "06:36" },
  ];
  const forecastFactor = forecastMode === "乐观" ? 1.08 : forecastMode === "保守" ? .92 : 1;
  const forecastSales = Math.round(totalSales / month.days * 31 * forecastFactor);

  return (
    <main id="top">
      <header className="site-header">
        <a className="site-mark" href="#top">刘庆安 <span>·</span> 数据作品演示</a>
        <a className="header-link" href="#dashboard">进入看板 ↓</a>
      </header>

      <section className="project-intro">
        <div className="intro-kicker">INTERACTIVE AUTOMATION DEMO</div>
        <h1>销售数据自动化<br />看板演示</h1>
        <p>部署在服务器上的全自动经营数据平台：定时连接业务数据源，识别并确认更新内容，主动报告异常，再生成可供团队成员统一访问的多主题经营看板。</p>
        <div className="automation-flow">
          <div><b>01</b><strong>定时采集</strong><span>服务器按计划连接业务系统，自动增量同步</span></div>
          <div><b>02</b><strong>更新确认</strong><span>对比新增日期、行数与指标变化，确认后发布</span></div>
          <div><b>03</b><strong>异常告警</strong><span>缺失日期、突增突降、映射失败主动报错</span></div>
          <div><b>04</b><strong>统一访问</strong><span>看板部署在网页端，团队成员打开链接即可使用</span></div>
        </div>
      </section>

      <section className="dashboard-stage" id="dashboard">
        <div className="dashboard-window">
          <aside className="side-nav">
            <div className="app-title"><span className="app-icon">D</span><div><strong>销售数据中心</strong><small>互动演示版本</small></div></div>
            <nav aria-label="数据模块">
              {navItems.map((item, index) => (
                <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => switchView(item.id)}>
                  <span className="nav-number">0{index + 1}</span><span><b>{item.label}</b><small>{item.hint}</small></span>
                </button>
              ))}
            </nav>
            <div className="privacy-note"><span className="live-dot" />服务器运行正常<br /><small>团队成员可通过网页统一访问</small></div>
          </aside>

          <div className="dashboard-main">
            <div className="dashboard-header">
              <div><span className="breadcrumb">数据看板 / {navItems.find((item) => item.id === view)?.label}</span><h2>{navItems.find((item) => item.id === view)?.label}</h2></div>
              <div className="data-date">数据更新至 <strong>2026-08-12</strong></div>
            </div>

            {view !== "update" && <div className="filter-bar">
              <div className="brand-switch" role="tablist" aria-label="品牌筛选">{brands.map((item, index) => <button key={item.name} className={brandIndex === index ? "active" : ""} onClick={() => { setBrandIndex(index); setExpandedProduct(null); setExpandedStore(null); }}>{item.name}</button>)}</div>
              <select value={monthIndex} onChange={(event) => setMonthIndex(Number(event.target.value))} aria-label="选择月份">{monthOptions.map((item, index) => <option key={item.label} value={index}>{item.label}{item.partial ? "（截至当前）" : ""}</option>)}</select>
            </div>}

            {view === "update" && <section className="panel update-panel">
              <div className="panel-heading"><div><span className="panel-kicker">AUTOMATION CENTER</span><h3>服务器自动任务中心</h3><p>系统每天按计划连接业务数据源，增量同步并完成质量检查，无需人工上传文件。</p></div><span className="safe-badge online">● 自动调度已开启</span></div>
              <div className="job-status-grid"><article><span>最近运行</span><strong>今日 06:30</strong><small>耗时 4分18秒</small></article><article><span>同步数据</span><strong>128,640</strong><small>新增明细行</small></article><article><span>质量校验</span><strong>12 / 15</strong><small>3项待确认</small></article><article><span>下次运行</span><strong>明日 06:30</strong><small>自动执行</small></article></div>
              <div className="pipeline"><div className="done"><b>1</b><span><strong>连接数据源</strong><small>销售 / 门店 / SKU</small></span></div><i /><div className="done"><b>2</b><span><strong>增量同步</strong><small>识别新增与变更</small></span></div><i /><div className="done"><b>3</b><span><strong>质量校验</strong><small>完整性与异常波动</small></span></div><i /><div className={confirmedUpdate ? "done" : "pending"}><b>4</b><span><strong>更新确认</strong><small>{confirmedUpdate ? "已确认发布" : "3项等待确认"}</small></span></div></div>
              <div className="import-progress"><div className="progress-copy"><span>{importMessage}</span><strong>{importProgress || 100}%</strong></div><div className="progress-track"><i style={{ width: `${importProgress || 100}%` }} /></div></div>
              <div className="update-actions"><button className="primary-button" onClick={simulateImport} disabled={importing}>{importing ? "任务运行中…" : "立即运行一次更新"}</button><button className="secondary-button" onClick={() => { setConfirmedUpdate(true); setImportMessage("更新内容已确认，看板已向全部访问者发布"); }}>确认并发布更新</button></div>
              <div className="change-list"><div><span className="change-type new">新增</span><strong>8个业务日期</strong><small>2026-08-05 至 2026-08-12</small></div><div><span className="change-type modify">变更</span><strong>3家门店主数据</strong><small>名称或所属区域发生变化</small></div><div><span className="change-type alert">异常</span><strong>2项指标波动</strong><small>已进入异常监控等待处理</small></div></div>
            </section>}

            {view === "overview" && <>
              <div className="metric-grid">
                <article><span>当月销售杯数</span><strong>{formatInt(totalSales)}</strong><small>{month.partial ? `统计 ${month.days} 天` : "完整月份"}</small></article>
                <article><span>活跃门店</span><strong>{brand.stores}</strong><small>家门店</small></article>
                <article><span>售卖产品</span><strong>{brand.sku}</strong><small>去重 SKU</small></article>
                <article className="accent"><span>同比增长</span><strong>+{brand.growth}%</strong><small>较上年同月</small></article>
              </div>
              <div className="overview-grid">
                <section className="panel trend-panel"><div className="panel-heading compact"><div><span className="panel-kicker">MONTHLY TREND</span><h3>近 6 个月销售趋势</h3></div><button className="text-button" onClick={() => switchView("products")}>查看产品明细 →</button></div><div className="bar-chart">{[62, 71, 67, 78, 84, 76].map((height, index) => <div key={index}><span className={index === 5 ? "current" : ""} style={{ height: `${height}%` }}><i>{formatInt(totalSales * (height / 76))}</i></span><small>{index + 3}月</small></div>)}</div></section>
                <section className="panel progress-panel"><span className="panel-kicker">BU PROGRESS</span><h3>当月目标进度</h3><strong className="progress-value">{(progress * 100).toFixed(1)}%</strong><div className="wide-track"><i style={{ width: `${Math.min(progress * 100, 100)}%` }} /></div><div className="progress-numbers"><span>实际 {formatInt(totalSales)}</span><span>目标 {formatInt(brand.target)}</span></div><p>历史月份仅显示实际进度；当前月根据数据库已有日期计算。</p></section>
              </div>
            </>}

            {view === "products" && <section className="panel data-panel">
              <div className="panel-heading table-heading"><div><span className="panel-kicker">PRODUCT → STORE</span><h3>产品月度销售排名</h3><p>点击产品行，展开查看门店 A—E 的销量和日均杯数。</p></div><button className="export-button" onClick={exportProducts}>导出当前结果</button></div>
              <div className="table-tools"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入部分产品名称自动筛选" /></label><span>USD = 销量 ÷ 售卖门店数 ÷ 统计天数</span></div>
              <div className="data-table product-table"><div className="table-head"><span>排名 / 产品</span><span>销售杯数</span><span>门店数</span><span>USD</span><span>同比</span></div>{visibleProducts.map((item) => <div className="expand-group" key={item.name}><button className="table-row" onClick={() => setExpandedProduct(expandedProduct === item.name ? null : item.name)} aria-expanded={expandedProduct === item.name}><span><b>{String(item.rank).padStart(2, "0")}</b><strong>{item.name}</strong><em>{expandedProduct === item.name ? "−" : "+"}</em></span><span>{formatInt(item.sales)}</span><span>{item.storeCount}</span><span>{item.usd.toFixed(2)}</span><span className={item.trend >= 0 ? "positive" : "negative"}>{item.trend >= 0 ? "+" : ""}{item.trend.toFixed(1)}%</span></button>{expandedProduct === item.name && <div className="nested-table"><div className="nested-title"><strong>{item.name} · 售卖门店销量 TOP 5</strong><button onClick={() => downloadCsv(`${item.name}_门店明细.csv`, [["门店", "编码", "销量", "日均", "销量占比"], ...item.stores.map((store) => [store.name, store.code, store.sales, store.daily.toFixed(2), `${(store.contribution * 100).toFixed(0)}%`])])}>导出明细</button></div><div className="nested-head"><span>门店</span><span>门店编码</span><span>销售杯数</span><span>日均杯数</span><span>销量占比</span></div>{item.stores.map((store) => <div className="nested-row" key={store.code}><span><b>{store.rank}</b>{store.name}</span><span>{store.code}</span><span>{formatInt(store.sales)}</span><span>{store.daily.toFixed(2)}</span><span><i style={{ width: `${store.contribution * 220}%` }} />{(store.contribution * 100).toFixed(0)}%</span></div>)}</div>}</div>)}{!visibleProducts.length && <div className="empty-state">没有匹配的产品，请更换关键词。</div>}</div>
            </section>}

            {view === "stores" && <section className="panel data-panel">
              <div className="panel-heading table-heading"><div><span className="panel-kicker">STORE → PRODUCT</span><h3>门店月度销售排名</h3><p>点击门店行，展开查看该门店销售的产品明细。</p></div><button className="export-button" onClick={exportStores}>导出当前结果</button></div>
              <div className="table-tools"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索门店名称或编码" /></label><span>门店按当月总销量降序排列</span></div>
              <div className="data-table store-table"><div className="table-head"><span>排名 / 门店</span><span>门店编码</span><span>销售杯数</span><span>产品数</span><span>日均杯数</span></div>{visibleStores.map((store) => <div className="expand-group" key={store.code}><button className="table-row" onClick={() => setExpandedStore(expandedStore === store.code ? null : store.code)} aria-expanded={expandedStore === store.code}><span><b>{String(store.rank).padStart(2, "0")}</b><strong>{store.name}</strong><em>{expandedStore === store.code ? "−" : "+"}</em></span><span>{store.code}</span><span>{formatInt(store.sales)}</span><span>{store.sku}</span><span>{store.daily.toFixed(2)}</span></button>{expandedStore === store.code && <div className="nested-table"><div className="nested-title"><strong>{store.name} · 产品销售明细</strong><button onClick={() => downloadCsv(`${store.name}_产品明细.csv`, [["产品", "销量", "日均"], ...store.products.map((item) => [item.name, item.sales, item.daily.toFixed(2)])])}>导出明细</button></div><div className="nested-head store-products"><span>产品</span><span>销售杯数</span><span>日均杯数</span></div>{store.products.map((item) => <div className="nested-row store-products" key={item.name}><span>{item.name}</span><span>{formatInt(item.sales)}</span><span>{item.daily.toFixed(2)}</span></div>)}</div>}</div>)}</div>
            </section>}

            {view === "regions" && <section className="region-layout">
              <div className="panel region-ranking"><div className="panel-heading table-heading"><div><span className="panel-kicker">REGION PERFORMANCE</span><h3>区域经营对比</h3><p>点击区域查看销售结构与关键表现。</p></div><button className="export-button" onClick={() => downloadCsv(`${brand.name}_${month.label}_区域经营.csv`, [["区域", "销量", "门店", "同比", "USD"], ...regionRows.map((item) => [item.name, Math.round(item.sales), item.stores, `${item.growth}%`, item.usd])])}>导出区域数据</button></div><div className="region-list">{regionRows.map((item, index) => <button key={item.name} className={selectedRegion === item.name ? "active" : ""} onClick={() => setSelectedRegion(item.name)}><span className="region-rank">0{index + 1}</span><span className="region-name"><strong>{item.name}</strong><small>{item.stores} 家活跃门店</small></span><span className="region-bar"><i style={{ width: `${item.sales / regionRows[0].sales * 100}%` }} /></span><span className="region-sales">{formatInt(item.sales)}<small>杯</small></span><span className={item.growth >= 0 ? "positive" : "negative"}>{item.growth >= 0 ? "+" : ""}{item.growth}%</span></button>)}</div></div>
              <div className="panel region-detail"><span className="panel-kicker">SELECTED REGION</span><h3>{selectedRegion}</h3>{(() => { const current = regionRows.find((item) => item.name === selectedRegion) ?? regionRows[0]; return <><div className="region-metrics"><div><span>销售杯数</span><strong>{formatInt(current.sales)}</strong></div><div><span>活跃门店</span><strong>{current.stores}</strong></div><div><span>区域 USD</span><strong>{current.usd.toFixed(2)}</strong></div><div><span>同比增长</span><strong className={current.growth >= 0 ? "positive" : "negative"}>{current.growth >= 0 ? "+" : ""}{current.growth}%</strong></div></div><h4>产品贡献 TOP 3</h4>{products.slice(0, 3).map((product, index) => <div className="contribution-row" key={product.name}><span>{product.name}</span><i><b style={{ width: `${82 - index * 18}%` }} /></i><strong>{formatInt(product.sales * (current.sales / totalSales))}</strong></div>)}</>; })()}</div>
            </section>}

            {view === "alerts" && <section className="alerts-layout">
              <div className="alert-summary"><article className="critical"><span>高优先级</span><strong>{alerts.filter((item) => item.level === "高" && !handledAlerts.includes(item.id)).length}</strong><small>需要立即处理</small></article><article><span>待确认异常</span><strong>{alerts.filter((item) => !handledAlerts.includes(item.id)).length}</strong><small>自动检测结果</small></article><article><span>今日已处理</span><strong>{handledAlerts.length + 7}</strong><small>处理记录已留痕</small></article><article><span>数据健康度</span><strong>96.8%</strong><small>15项规则持续监控</small></article></div>
              <div className="panel alert-panel"><div className="panel-heading table-heading"><div><span className="panel-kicker">ANOMALY MONITOR</span><h3>异常值与数据质量告警</h3><p>系统自动识别缺失、突增突降和映射异常，处理状态向所有访问者同步。</p></div><span className="safe-badge online">实时监控中</span></div><div className="alert-list">{alerts.map((item) => { const handled = handledAlerts.includes(item.id); return <article key={item.id} className={handled ? "handled" : ""}><span className={`severity level-${item.level}`}>{handled ? "已处理" : `${item.level}优先级`}</span><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.id} · 今日 {item.time}</small></div><button onClick={() => setHandledAlerts((current) => handled ? current.filter((id) => id !== item.id) : [...current, item.id])}>{handled ? "撤回确认" : "确认并标记处理"}</button></article>; })}</div></div>
            </section>}

            {view === "forecast" && <section className="forecast-layout">
              <div className="panel forecast-main"><div className="panel-heading table-heading"><div><span className="panel-kicker">MONTH-END FORECAST</span><h3>月底销量预测</h3><p>结合已发生日期、周末与历史波动生成三种情景。</p></div><div className="scenario-tabs">{["保守", "基准", "乐观"].map((item) => <button key={item} className={forecastMode === item ? "active" : ""} onClick={() => setForecastMode(item)}>{item}</button>)}</div></div><div className="forecast-value"><span>{forecastMode}情景预测销量</span><strong>{formatInt(forecastSales)}</strong><small>预计月底达成目标的 {(forecastSales / brand.target * 100).toFixed(1)}%</small></div><div className="forecast-chart">{[42, 48, 51, 58, 62, 68, 74, 81, 88, 94].map((value, index) => <div key={index}><i style={{ height: `${value * forecastFactor}%` }} className={index >= 4 ? "predicted" : "actual"} /><span>{index < 4 ? `${index * 3 + 3}日` : `${index * 3 + 3}日`}</span></div>)}</div><div className="chart-legend"><span><i className="actual" />已发生销量</span><span><i className="predicted" />预测销量</span></div></div>
              <div className="panel forecast-drivers"><span className="panel-kicker">FORECAST DRIVERS</span><h3>预测影响因素</h3><div><span>周末拉动</span><strong className="positive">+12.4%</strong></div><div><span>门店数量变化</span><strong className="positive">+3.1%</strong></div><div><span>近期日均波动</span><strong className="negative">-2.8%</strong></div><div><span>新品销售贡献</span><strong className="positive">+5.6%</strong></div><p>预测仅针对当前未完结月份；历史月份保留实际结果，不再重新预估。</p></div>
            </section>}

            {view === "launch" && <section className="launch-grid">
              <div className="panel config-panel"><span className="panel-kicker">DASHBOARD CONFIG</span><h3>看板生成配置</h3><p>修改产品、上市日期和目标销量，点击按钮即时生成看板。</p><label>产品名称<select value={launchProduct} onChange={(event) => { setLaunchProduct(event.target.value); setGenerated(false); }}>{productSeeds.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label>上市日期<input type="date" value={launchDate} onChange={(event) => { setLaunchDate(event.target.value); setGenerated(false); }} /></label><label>销售目标<input type="number" value={target} onChange={(event) => { setTarget(Number(event.target.value)); setGenerated(false); }} /></label><button className="primary-button" onClick={() => setGenerated(true)}>生成产品销售看板</button></div>
              <div className={`panel result-panel ${generated ? "ready" : "waiting"}`}><div className="panel-heading compact"><div><span className="panel-kicker">PRODUCT RESULT</span><h3>{launchProduct}</h3></div><span className="demo-badge">演示结果</span></div>{generated ? <><div className="result-metrics"><div><span>累计销量</span><strong>{formatInt(launchSales)}</strong></div><div><span>销售门店</span><strong>{launchResult.storeCount}</strong></div><div><span>统计天数</span><strong>{launchDays}</strong></div><div><span>整体 USD</span><strong>{(launchSales / launchResult.storeCount / launchDays).toFixed(2)}</strong></div></div><div className="target-progress"><div><span>目标达成进度</span><strong>{target ? `${(launchSales / target * 100).toFixed(1)}%` : "无目标"}</strong></div><div className="wide-track"><i style={{ width: `${target ? Math.min(launchSales / target * 100, 100) : 0}%` }} /></div><small>上市日期 {launchDate} · 统计截止 2026-08-12</small></div></> : <div className="waiting-copy">配置已修改，点击“生成产品销售看板”查看新结果。</div>}</div>
            </section>}
          </div>
        </div>
      </section>

      <section className="thinking-section" id="thinking">
        <div className="section-heading dark-heading"><div><span className="section-index">HOW IT WORKS</span><h2>从业务规则到可长期使用的数据工具</h2></div></div>
        <div className="thinking-grid">
          <article><span>01</span><h3>服务器自动更新</h3><p>定时连接销售、门店和 SKU 数据源，自动识别新增与变更；无需人工下载、整理和上传文件。</p></article>
          <article><span>02</span><h3>更新确认与异常报错</h3><p>发布前核对日期、行数和核心指标变化；发现缺失、突增突降或映射失败时主动告警。</p></article>
          <article><span>03</span><h3>所有成员统一访问</h3><p>看板部署在服务器，通过网页链接即可使用；更新结果、异常状态和处理记录对所有访问者同步。</p></article>
        </div>
        <div className="role-note"><span>平台功能范围</span><p>自动采集 · 增量更新 · 质量校验 · 异常预警 · 多层分析 · 预测看板 · 导出共享</p></div>
      </section>

      <footer><strong>刘庆安 · 数据看板作品演示</strong><span>业务数据已脱敏并经过模拟处理。</span><a href="#top">回到顶部 ↑</a></footer>
    </main>
  );
}
