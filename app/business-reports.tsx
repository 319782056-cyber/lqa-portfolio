"use client";

import { useMemo, useState } from "react";

type Props = { brandName: string; totalSales: number; days: number; monthLabel: string };
type Period = "日报" | "周报";

const fmt = (n: number) => Math.round(n).toLocaleString("zh-CN");
const pct = (n: number) => (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%";

export default function BusinessReports({ brandName, totalSales, days, monthLabel }: Props) {
  const [period, setPeriod] = useState<Period>("日报");
  const [showAll, setShowAll] = useState(false);
  const dailyBase = totalSales / Math.max(1, days);
  const report = useMemo(() => {
    const dayFactors = [0.91, 0.96, 0.94, 1.02, 1.08, 1.16, 1.11];
    const dayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const daysData = dayFactors.map((factor, i) => ({
      label: dayLabels[i],
      sales: Math.round(dailyBase * factor),
      previous: Math.round(dailyBase * factor * [0.98, 1.01, 0.97, 0.96, 1.04, 1.08, 1.03][i]),
    }));
    const weekFactors = [0.82, 0.91, 0.88, 1.04];
    const weeks = weekFactors.map((factor, i) => ({
      label: "第" + (i + 1) + "周",
      sales: Math.round(dailyBase * 7 * factor),
      previous: Math.round(dailyBase * 7 * factor * [0.95, 1.03, 0.97, 0.92][i]),
    }));
    const products = [
      { name: "青提茉莉冰茶", stage: "上市第 12 天", sales: Math.round(totalSales * 0.064), target: 0.72, coverage: 0.68, growth: 0.184 },
      { name: "桂花乌龙鲜奶茶", stage: "上市第 24 天", sales: Math.round(totalSales * 0.052), target: 0.86, coverage: 0.81, growth: 0.092 },
      { name: "芝芝莓莓轻乳茶", stage: "上市第 8 天", sales: Math.round(totalSales * 0.031), target: 0.49, coverage: 0.43, growth: 0.267 },
    ];
    return { daysData, weeks, products };
  }, [dailyBase, totalSales]);
  const rows = period === "日报" ? report.daysData : report.weeks;
  const current = rows.reduce((sum, row) => sum + row.sales, 0);
  const previous = rows.reduce((sum, row) => sum + row.previous, 0);
  const change = current / Math.max(1, previous) - 1;
  const max = Math.max(...rows.map(row => row.sales));
  const topProduct = [...report.products].sort((a, b) => b.sales - a.sales)[0];
  const insights = period === "日报"
    ? [
        { icon: "📈", title: "销售节奏", text: "周末两日模拟销量高于工作日均值，建议结合客流、营业时长和促销活动观察峰值来源。" },
        { icon: "🧋", title: "新品表现", text: topProduct.name + "当前新品样例销量领先，累计 " + fmt(topProduct.sales) + " 杯；建议继续跟踪上新后 7 / 14 / 30 日表现。" },
        { icon: "🎯", title: "经营动作", text: "关注销量提升是否同步带来订单与客单价增长，避免只看销量判断经营质量。" },
      ]
    : [
        { icon: "📊", title: "周度趋势", text: (change >= 0 ? "本周" : "本周") + "相较对照周" + (change >= 0 ? "增长 " : "下降 ") + Math.abs(change * 100).toFixed(1) + "%；建议拆分产品、门店和渠道贡献定位变化来源。" },
        { icon: "🚀", title: "新品进度", text: "当前新品中 " + topProduct.name + "销量最高，目标完成率 " + (topProduct.target * 100).toFixed(0) + "%；可优先检查低覆盖门店的陈列与动销。" },
        { icon: "🧭", title: "下周关注", text: "建议持续观察新品铺货覆盖、单店日均销量和新品对整体销售的增量贡献。" },
      ];

  return <section className="dash-card report-panel">
    <header><div><small>DAILY & WEEKLY BUSINESS BRIEF</small><h3>经营日报 / 周报</h3><p>{brandName} · {monthLabel} · 自动汇总演示数据变化与新品进度</p></div><span className="dash-tag">规则生成 · 模拟数据</span></header>
    <div className="report-toolbar">
      <div className="report-switch">{(["日报", "周报"] as Period[]).map(item => <button key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{item}</button>)}</div>
      <span>对比口径：{period === "日报" ? "模拟前一日" : "模拟对照周"}</span>
    </div>
    <div className="report-kpis">
      <article><small>{period === "日报" ? "近 7 日销量" : "近 4 周销量"}</small><strong>{fmt(current)} <i>杯</i></strong><span>样例周期汇总</span></article>
      <article><small>对比变化</small><strong className={change >= 0 ? "positive" : "negative"}>{pct(change)}</strong><span>与模拟对照周期比较</span></article>
      <article><small>新品样例数</small><strong>{report.products.length}</strong><span>纳入追踪的新品</span></article>
      <article><small>新品平均目标进度</small><strong>{(report.products.reduce((s, p) => s + p.target, 0) / report.products.length * 100).toFixed(1)}%</strong><span>按演示目标计算</span></article>
    </div>
    <div className="report-chart-card">
      <div className="report-subhead"><div><h4>{period === "日报" ? "每日销量走势" : "每周销量走势"}</h4><small>柱形为当前模拟周期，虚线刻度仅作视觉参照</small></div><b>单位：杯</b></div>
      <div className="report-bars">{rows.map(row => <div className="report-bar" key={row.label}><b>{fmt(row.sales)}</b><i style={{ height: Math.max(5, row.sales / max * 100) + "%" }} /><small>{row.label}</small></div>)}</div>
    </div>
    <div className="report-insights"><div className="report-section-title"><h4>经营变化自动解读</h4><small>规则化文本分析 · 每条结论对应上方指标</small></div><div className="report-insight-grid">{insights.map(item => <article key={item.title}><b>{item.icon} {item.title}</b><p>{item.text}</p></article>)}</div></div>
    <div className="report-new-products">
      <div className="report-section-title"><div><h4>新品销售进度追踪</h4><small>以新品上市周期、销量目标与门店覆盖观察冷启动表现</small></div><button onClick={() => setShowAll(!showAll)}>{showAll ? "收起" : "查看分析口径"}</button></div>
      <div className="report-product-list">{report.products.map(product => <article key={product.name}>
        <div className="report-product-head"><div><b>{product.name}</b><small>{product.stage}</small></div><strong>{fmt(product.sales)} <i>杯</i></strong></div>
        <div className="report-progress-label"><span>目标完成率</span><b>{(product.target * 100).toFixed(0)}%</b></div><i className="report-progress"><em style={{ width: Math.min(100, product.target * 100) + "%" }} /></i>
        <div className="report-product-meta"><span>门店覆盖率 <b>{(product.coverage * 100).toFixed(0)}%</b></span><span>模拟环比 <b className={product.growth >= 0 ? "positive" : "negative"}>{pct(product.growth)}</b></span><span>销量排名 <b>新品 #{report.products.slice().sort((a,b)=>b.sales-a.sales).findIndex(p=>p.name===product.name)+1}</b></span></div>
      </article>)}</div>
      {showAll && <p className="report-method-note">新品进度口径：目标完成率 = 新品累计销量 ÷ 演示目标销量；门店覆盖率 = 有售门店数 ÷ 目标门店数。上市天数、目标值、覆盖率和新品对比系数均为虚构示例，非真实新品经营记录。</p>}
    </div>
    <p className="report-disclaimer">数据说明：本模块根据内置模拟参数在页面端即时汇总，不会自动读取真实订单或定时生成/发送日报周报。日度与周度序列为演示构造，用于展示趋势解读和经营报告表达。</p>
  </section>;
}
