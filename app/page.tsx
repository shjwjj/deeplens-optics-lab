"use client";

import { useMemo, useState } from "react";

type ApertureKey = "2.0" | "2.8" | "4.0";
type ViewKey = "layout" | "spot" | "mtf" | "distortion" | "vignetting";

const experiments: Record<
  ApertureKey,
  {
    center: number;
    middle: number;
    edge: number;
    image: string;
    summary: string;
  }
> = {
  "2.0": {
    center: 15.1582,
    middle: 10.5258,
    edge: 20.5321,
    image: "lab/spot-f2.png",
    summary: "大光圈进光量高，但较多孔径边缘光线参与成像，几何像差最明显。",
  },
  "2.8": {
    center: 6.5781,
    middle: 4.0877,
    edge: 11.644,
    image: "lab/spot-f2-8.png",
    summary: "从 F/2 收到 F/2.8 后，三处视场的光斑均明显缩小，是很有效的一步。",
  },
  "4.0": {
    center: 6.1928,
    middle: 3.9236,
    edge: 10.1126,
    image: "lab/spot-f4.png",
    summary: "继续缩至 F/4 仍有改善，但边际收益下降；真实设计还需检查衍射和进光量。",
  },
};

const views: Array<{ key: ViewKey; label: string }> = [
  { key: "layout", label: "镜头结构" },
  { key: "spot", label: "点列图" },
  { key: "mtf", label: "MTF" },
  { key: "distortion", label: "畸变" },
  { key: "vignetting", label: "渐晕" },
];

const fixedImages: Record<Exclude<ViewKey, "spot">, string> = {
  layout: "lab/lens-layout.png",
  mtf: "lab/mtf.png",
  distortion: "lab/distortion.png",
  vignetting: "lab/vignetting.png",
};

export default function Home() {
  const [aperture, setAperture] = useState<ApertureKey>("2.8");
  const [view, setView] = useState<ViewKey>("spot");
  const result = experiments[aperture];
  const image = view === "spot" ? result.image : fixedImages[view];

  const interpretation = useMemo(() => {
    const ratio = result.edge / result.center;
    return [
      `全视场光斑约为中心的 ${ratio.toFixed(1)} 倍，离轴像差仍是主要挑战。`,
      result.summary,
      aperture === "4.0"
        ? "不能仅凭几何光斑选定 F/4；还要将衍射 MTF、曝光和制造约束加入评价。"
        : "下一步可以继续缩光圈，观察改善幅度是否值得付出进光量代价。",
    ];
  }, [aperture, result]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#lab" aria-label="返回实验室">
          <span className="brand-mark" aria-hidden="true" />
          <span>DeepLens Lab</span>
        </a>
        <div className="top-meta">
          <span>公开演示</span>
          <a href="https://github.com/vccimaging/DeepLens">GitHub</a>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">OPTICAL DESIGN LEARNING LAB</p>
          <h1>从一束光线开始，理解镜头。</h1>
          <p className="lede">
            改变一个参数，查看真实光线追迹结果，再用物理原因解释变化。
          </p>
        </div>
        <div className="intro-note">
          <strong>实验 01</strong>
          <p>保持镜片结构、材料和传感器不变，只改变光圈 F 数。</p>
        </div>
      </section>

      <section className="lab" id="lab">
        <aside className="controls">
          <div className="control-heading">
            <span>实验控制台</span>
            <span className="status-dot">已验证数据</span>
          </div>

          <div className="lens-name">
            <span>当前镜头</span>
            <strong>80° 手机广角镜头</strong>
            <p>多片非球面结构，适合观察边缘像差和畸变。</p>
          </div>

          <fieldset>
            <legend>选择 F 数</legend>
            <div className="aperture-options">
              {(Object.keys(experiments) as ApertureKey[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={aperture === value ? "selected" : ""}
                  aria-pressed={aperture === value}
                  onClick={() => setAperture(value)}
                >
                  F/{value}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="formula">
            <span>F-number</span>
            <strong>焦距 ÷ 入瞳直径</strong>
          </div>

          <p className="disclosure">
            公网版展示本机 DeepLens 已计算并验证的结果，不在浏览器内伪装实时运行 Python。
          </p>
        </aside>

        <div className="workspace">
          <div className="metrics">
            <article>
              <span>焦距</span>
              <strong>5.16 mm</strong>
            </article>
            <article>
              <span>中心 RMS</span>
              <strong>{result.center.toFixed(2)} μm</strong>
            </article>
            <article>
              <span>半视场 RMS</span>
              <strong>{result.middle.toFixed(2)} μm</strong>
            </article>
            <article>
              <span>全视场 RMS</span>
              <strong>{result.edge.toFixed(2)} μm</strong>
            </article>
          </div>

          <div className="view-tabs" role="tablist" aria-label="评价图">
            {views.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={view === item.key}
                className={view === item.key ? "active" : ""}
                key={item.key}
                onClick={() => setView(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <figure className="visual">
            <img src={image} alt={`${views.find((item) => item.key === view)?.label}分析结果`} />
            <figcaption>
              {view === "spot"
                ? `F/${aperture}：从中心、半视场到全视场比较光斑形状与大小。`
                : "基准镜头的完整光学评价结果。"}
            </figcaption>
          </figure>

          <section className="explanation">
            <div>
              <span>光学解释</span>
              <strong>为什么结果会这样？</strong>
            </div>
            <ol>
              {interpretation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        </div>
      </section>

      <section className="lesson">
        <div>
          <h2>光学设计不是把一个数字做到最好。</h2>
          <p>
            缩光圈通常能减小几何像差，但会损失进光量；光圈过小时，衍射又会降低高频 MTF。
            真正的设计是在清晰度、尺寸、成本、制造难度与能量之间寻找平衡。
          </p>
        </div>
        <img src="lab/aperture-vs-spot.png" alt="F 数与 RMS 光斑关系图" />
      </section>

      <footer>
        <span>DeepLens 光学设计学习实验室</span>
        <span>实验数据由 Apple M4 上的 DeepLens 生成</span>
      </footer>
    </main>
  );
}
