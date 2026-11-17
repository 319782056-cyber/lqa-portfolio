"use client";

import type { ReactNode } from "react";

export type AdvancedPanelType = "profit" | "customer" | "inventory" | "channel";

type Props = {
  type: AdvancedPanelType;
  totalSales: number;
  days: number;
  brandName: string;
  brandScale: number;
  target: number;
};

const number = (value: number) => Math.round(value).toLocaleString("zh-CN");
const money = (value: number) => "¥" + number(value);
const percent = (value: number) => (value * 100).toFixed(1) + "%";

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="advanced-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Panel({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <section className="dash-card advanced-panel"><header><div><small>{eyebrow}</small><h3>{title}</h3><p>{description}</p></div><span className="dash-tag">情景模拟</span></header>{children}</section>;
}

export default function AdvancedAnalytics({ type, totalSales, days, brandName, brandScale, target }: Props) {
  const profile = brandName === "品牌 B"
    ? { price: 19.6, cost: 7.1, discount: .055, repeat: .41, delivery: .49 }
    : brandName === "品牌 C"
      ? { price: 17.2, cost: 6.4, discount: .075, repeat: .34, delivery: .57 }
      : { price: 18.8, cost: 6.8, discount: .06, repeat: .38, delivery: .54 };
  const grossRevenue = totalSales * profile.price;
  const netRevenue = grossRevenue * (1 - profile.discount);
  const productCost = totalSales * profile.cost;
  const grossProfit = netRevenue - productCost;
  const marketingCost = netRevenue * .045;
  const storeOperatingCost = 486 * brandScale * 4200;
  const operatingProfit = grossProfit - marketingCost - storeOperatingCost;
  const grossMargin = netRevenue ? grossProfit / netRevenue : 0;
  const operatingMargin = netRevenue ? operatingProfit / netRevenue : 0;
  const orders = totalSales / 1.42;
  const buyers = orders * .72;
  const dailySales = totalSales / days;
  const inventoryDays = 8.5;
  const inventoryUnits = dailySales * inventoryDays;
  const channelMix = [
    { name: "外卖配送", share: profile.delivery, color: "channel-a" },
    { name: "到店自取", share: .31, color: "channel-b" },
    { name: "堂食", share: 1 - profile.delivery - .31, color: "channel-c" },
  ];
  const funnel = [
    { name: "曝光 / 访问", value: buyers / .068, share: 1 },
    { name: "商品浏览", value: buyers / .068 * .62, share: .62 },
    { name: "加入购物车", value: buyers / .068 * .21, share: .21 },
    { name: "支付订单", value: orders, share: orders / (buyers / .068) },
  ];

  if (type === "profit") return <Panel eyebrow="UNIT ECONOMICS" title="收入、毛利与经营利润" description="从销量推导收入和成本，拆解单杯经济模型；所有价格、折扣及费用率均为演示假设。">
    <div className="advanced-metrics">
      <Metric label="含折扣前销售额" value={money(grossRevenue)} note={number(totalSales) + " 杯 × 均价 " + profile.price.toFixed(1) + " 元"} />
      <Metric label="净销售收入" value={money(netRevenue)} note={"模拟折扣率 " + percent(profile.discount)} />
      <Metric label="毛利额" value={money(grossProfit)} note={"毛利率 " + percent(grossMargin)} />
      <Metric label="经营利润估算" value={money(operatingProfit)} note={"经营利润率 " + percent(operatingMargin)} />
    </div>
    <div className="advanced-split">
      <div><h4>单杯经济模型</h4>{[
        ["商品标价", profile.price],
        ["折扣让利", profile.price * profile.discount],
        ["净收入", profile.price * (1 - profile.discount)],
        ["产品成本", profile.cost],
        ["单杯毛利", profile.price * (1 - profile.discount) - profile.cost],
      ].map(([label, value]) => <div className="advanced-line" key={String(label)}><span>{label}</span><b>{money(Number(value))}</b></div>)}</div>
      <div><h4>利润结构拆解</h4>{[
        ["商品成本", productCost, "#9bb7a5"],
        ["营销费用", marketingCost, "#c9a36e"],
        ["门店运营费用", storeOperatingCost, "#8da7bf"],
        ["经营利润", operatingProfit, "#287b5c"],
      ].map(([label, value, color]) => <div className="advanced-line" key={String(label)}><span>{label}</span><b>{money(Number(value))}</b><i className="advanced-mini-track"><em style={{ width: Math.max(2, Math.abs(Number(value)) / Math.max(1, netRevenue) * 100) + "%", background: String(color) }} /></i></div>)}</div>
    </div>
    <p className="advanced-caveat">口径提醒：未纳入税费、平台佣金、租金差异、人工排班、损耗和总部费用。此处为单元经济模型演示，不应当作真实利润报表。</p>
  </Panel>;

  if (type === "customer") return <Panel eyebrow="CUSTOMER INTELLIGENCE" title="用户价值与复购分析" description="以订单、客单和复购假设构建用户经营视图，展示用户分层及生命周期指标。">
    <div className="advanced-metrics">
      <Metric label="估算订单数" value={number(orders)} note="销量 ÷ 估算每单杯数 1.42" />
      <Metric label="估算购买用户" value={number(buyers)} note="订单数 × 用户覆盖系数 72%" />
      <Metric label="估算客单价" value={money(netRevenue / Math.max(1, orders))} note="净收入 ÷ 订单数" />
      <Metric label="复购用户占比" value={percent(profile.repeat)} note="模拟用户分层参数" />
    </div>
    <div className="advanced-split">
      <div><h4>用户生命周期分层</h4>{[
        ["新客", .35, "首购转化与首单体验"],
        ["活跃复购客", .45, "会员权益与消费频次"],
        ["沉睡 / 流失风险", .20, "召回触达与优惠唤醒"],
      ].map(([name, share, note]) => <div className="advanced-segment" key={String(name)}><div><b>{name}</b><span>{percent(Number(share))}</span></div><i><em style={{ width: Number(share) * 100 + "%" }} /></i><small>{number(buyers * Number(share))} 人 · {note}</small></div>)}</div>
      <div><h4>建议跟踪的用户指标</h4>{[
        ["30 日复购率", percent(profile.repeat), "衡量用户留存质量"],
        ["购买频次", "1.8 次 / 月", "识别高价值消费人群"],
        ["用户生命周期价值", money(netRevenue / Math.max(1, buyers) * 4.6), "需结合长期留存数据验证"],
        ["获客成本", money(marketingCost / Math.max(1, buyers * .35)), "营销费用 ÷ 新客数"],
      ].map(([label, value, note]) => <div className="advanced-line" key={String(label)}><span>{label}<small>{note}</small></span><b>{value}</b></div>)}</div>
    </div>
    <p className="advanced-caveat">用户数、复购率、频次和生命周期价值均为模拟参数推导。真实分析需使用脱敏会员 ID、订单明细和用户行为事件，并明确去重窗口。</p>
  </Panel>;

  if (type === "inventory") return <Panel eyebrow="INVENTORY & SUPPLY" title="库存健康与补货建议" description="将销售速度转换为库存覆盖、补货点和安全库存，展示从销售分析到供应链决策的延伸。">
    <div className="advanced-metrics">
      <Metric label="估算日均销量" value={number(dailySales) + " 杯"} note="当前周期销量 ÷ 统计天数" />
      <Metric label="库存覆盖天数" value={inventoryDays.toFixed(1) + " 天"} note="演示库存策略参数" />
      <Metric label="估算现有库存" value={number(inventoryUnits) + " 杯"} note="日均销量 × 覆盖天数" />
      <Metric label="建议补货点" value={number(dailySales * 5.8) + " 杯"} note="5.8 天需求量，含安全缓冲" />
    </div>
    <div className="advanced-split">
      <div><h4>库存结构健康度</h4>{[
        ["可售库存", .72, "正常周转"],
        ["安全库存", .22, "应对需求波动"],
        ["风险库存", .06, "临期 / 滞销关注"],
      ].map(([name, share, note]) => <div className="advanced-segment" key={String(name)}><div><b>{name}</b><span>{percent(Number(share))}</span></div><i><em style={{ width: Number(share) * 100 + "%" }} /></i><small>{note}</small></div>)}</div>
      <div><h4>补货策略建议</h4>{[
        ["再订货点", number(dailySales * 5.8) + " 杯", "库存低于该值触发补货评估"],
        ["安全库存", number(dailySales * 2.2) + " 杯", "覆盖约 2.2 天需求波动"],
        ["建议订货量", number(dailySales * 7) + " 杯", "按 7 天周期滚动补货"],
        ["库存周转天数", "6.2 天", "需结合真实期初期末库存核算"],
      ].map(([label, value, note]) => <div className="advanced-line" key={String(label)}><span>{label}<small>{note}</small></span><b>{value}</b></div>)}</div>
    </div>
    <p className="advanced-caveat">库存数量由销量和假设覆盖天数反推，并非真实仓储数据。真实落地应按原料 SKU、保质期、门店库存、在途量和供应商交期建模。</p>
  </Panel>;

  return <Panel eyebrow="CHANNEL & CONVERSION" title="渠道结构与转化漏斗" description="拆解渠道贡献与购买链路，识别流量流失位置，为渠道投放和转化优化提供分析框架。">
    <div className="advanced-metrics">
      <Metric label="估算总订单" value={number(orders)} note="按 1.42 杯 / 单推算" />
      <Metric label="外卖渠道收入" value={money(netRevenue * profile.delivery)} note={"收入占比 " + percent(profile.delivery)} />
      <Metric label="到店自取收入" value={money(netRevenue * .31)} note="收入占比 31.0%" />
      <Metric label="堂食收入" value={money(netRevenue * (1 - profile.delivery - .31))} note={"收入占比 " + percent(1 - profile.delivery - .31)} />
    </div>
    <div className="advanced-split">
      <div><h4>渠道收入结构</h4><div className="advanced-channel-stack">{channelMix.map(item => <i key={item.name} className={item.color} style={{ width: item.share * 100 + "%" }} />)}</div>{channelMix.map(item => <div className="advanced-line" key={item.name}><span>{item.name}</span><b>{percent(item.share)} · {money(netRevenue * item.share)}</b></div>)}</div>
      <div><h4>购买转化漏斗</h4>{funnel.map((item, index) => <div className="advanced-funnel-row" key={item.name}><div><span>{item.name}</span><b>{number(item.value)}</b></div><i><em style={{ width: Math.max(2, item.share * 100) + "%" }} /></i><small>{index === 0 ? "基准流量" : "相对首层转化 " + percent(item.share)}</small></div>)}</div>
    </div>
    <p className="advanced-caveat">渠道占比和转化率是演示参数，漏斗各层为模型推算值，不代表埋点采集结果。真实分析需统一渠道归因规则、去重口径和转化时间窗。</p>
  </Panel>;
}
