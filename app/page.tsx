"use client";

import { useMemo, useState } from "react";

type ApertureKey = "2.0" | "2.8" | "4.0";
type ViewKey = "aperture" | "layout" | "spot" | "mtf" | "distortion" | "vignetting";

type ConceptGuide = {
  title: string;
  plain: string;
  howToRead: string[];
  photoImpact: string;
  remember: string;
};

const experiments: Record<
  ApertureKey,
  {
    center: number;
    middle: number;
    edge: number;
    image: string;
    summary: string;
    pupilScale: number;
    relativeLight: string;
    lightLoss: string;
    depth: string;
    diffraction: string;
  }
> = {
  "2.0": {
    center: 15.1582,
    middle: 10.5258,
    edge: 20.5321,
    image: "lab/spot-f2.png",
    summary: "进光最多，但孔径边缘的光线也参与成像，三处视场的几何光斑都较大。",
    pupilScale: 1,
    relativeLight: "100%",
    lightLoss: "当前比较基准",
    depth: "较浅",
    diffraction: "较低",
  },
  "2.8": {
    center: 6.5781,
    middle: 4.0877,
    edge: 11.644,
    image: "lab/spot-f2-8.png",
    summary: "比 F/2 少约一档光，但三处视场的光斑都明显缩小，是很有效的一步。",
    pupilScale: 0.71,
    relativeLight: "51%",
    lightLoss: "比 F/2 少约 1 档",
    depth: "中等",
    diffraction: "仍较低",
  },
  "4.0": {
    center: 6.1928,
    middle: 3.9236,
    edge: 10.1126,
    image: "lab/spot-f4.png",
    summary: "比 F/2 只剩四分之一进光，几何光斑继续变小，但改善幅度已经下降。",
    pupilScale: 0.5,
    relativeLight: "25%",
    lightLoss: "比 F/2 少 2 档",
    depth: "更深",
    diffraction: "开始需要检查",
  },
};

const views: Array<{ key: ViewKey; label: string; hint: string }> = [
  { key: "aperture", label: "光圈 / F 数", hint: "亮度与清晰度" },
  { key: "layout", label: "镜头结构", hint: "光如何穿过镜片" },
  { key: "spot", label: "点列图", hint: "一个点有多散" },
  { key: "mtf", label: "MTF", hint: "细节对比度" },
  { key: "distortion", label: "畸变", hint: "直线会不会弯" },
  { key: "vignetting", label: "渐晕", hint: "四角会不会暗" },
];

const fixedImages: Record<Exclude<ViewKey, "spot">, string> = {
  aperture: "lab/aperture-vs-spot.png",
  layout: "lab/lens-layout.png",
  mtf: "lab/mtf.png",
  distortion: "lab/distortion.png",
  vignetting: "lab/vignetting.png",
};

const conceptGuides: Record<ViewKey, ConceptGuide> = {
  aperture: {
    title: "光圈是镜头里可以改变大小的开口",
    plain: "F 数等于焦距除以入瞳直径。F 后面的数字越小，开口越大，进入镜头的光越多。",
    howToRead: [
      "F/2 的开口比 F/4 大，进光量是 F/4 的 4 倍。",
      "图中横轴是 F 数，纵轴是 RMS 光斑半径。曲线越低，几何光斑越集中。",
      "选光圈时要一起看亮度、景深、几何像差和衍射，不能只追求一个数字。",
    ],
    photoImpact: "大光圈更亮、景深更浅，但像差通常更明显。收小光圈会增加景深并压低像差，过小又可能被衍射拖软。",
    remember: "小 F 数 = 大开口 = 更多光",
  },
  layout: {
    title: "镜头结构是所有镜片和光阑的排列方式",
    plain: "每个黑色轮廓是一片镜片的表面。彩色线代表来自中心、半视场和画面边缘的光线，最右侧黑线是传感器像面。",
    howToRead: [
      "看不同颜色的光线最后是否落到各自应到的位置。",
      "看镜片弯曲和间距如何逐步折转光线。",
      "片数更多不等于一定更好，它也会增加体积、成本和制造难度。",
    ],
    photoImpact: "结构本身不会直接出现在照片里，但它决定视场、清晰度、畸变、颜色边缘、镜头长度和成本。",
    remember: "镜头结构决定光线走哪条路",
  },
  spot: {
    title: "点列图检查一个物点最后散成多大的光斑",
    plain: "理想镜头会让同一物点发出的所有光线汇聚到一个点。图上每个小点是一条光线落在传感器上的位置。",
    howToRead: [
      "先比点云大小，越紧凑通常越清晰。",
      "再看中心、半视场和全视场，边缘通常更难校正。",
      "不同颜色分开表示色差，拉出尾巴常提示彗差或像散等离轴像差。",
    ],
    photoImpact: "点云越散，同一个物点会摊成更大的斑，照片细节更糊。边缘出现翅膀或尾巴时，画面四角往往尤其不清楚。",
    remember: "点越聚，成像通常越锐",
  },
  mtf: {
    title: "MTF 表示镜头保留明暗对比的能力",
    plain: "拍摄黑白相间的条纹时，镜头会让边界变软。MTF 衡量输出条纹还剩多少对比度，1 最好，0 表示分不清。",
    howToRead: [
      "横轴越往右，代表越细的纹理；纵轴越高，代表保留的对比度越多。",
      "实线 T 与虚线 S 相差大，说明两个方向的清晰度不一致。",
      "比较三幅视场图，可以判断中心、半视场和边缘是否一样清楚。",
    ],
    photoImpact: "曲线越高，文字、头发和纹理越分明。本图高频曲线下降明显，不同视场和方向也有差异，细小纹理会比较弱。",
    remember: "同一频率下，MTF 越高越好",
  },
  distortion: {
    title: "畸变让位置发生偏移，但不等同于模糊",
    plain: "镜头可能把本应是直线的物体拍弯。向外鼓叫桶形畸变，向内收叫枕形畸变。",
    howToRead: [
      "横轴 0% 是没有畸变，曲线离 0 越远，几何变形越明显。",
      "负值通常对应桶形畸变，正值通常对应枕形畸变。",
      "观察全视场末端，因为照片边缘的变形通常最明显。",
    ],
    photoImpact: "本图边缘接近 -16%，属于明显桶形畸变，建筑直线会向外鼓。软件可以校正，但会裁切画面并重新插值像素。",
    remember: "畸变管形状，点列图管清晰度",
  },
  vignetting: {
    title: "渐晕表示画面四角收到的光比中心少",
    plain: "越靠近画面边缘，光线越容易被镜筒或光阑挡住，也会受到自然照度下降影响，因此四角可能变暗。",
    howToRead: [
      "相对照度 1 表示和中心一样亮，越接近 0 就越暗。",
      "照度图若从中心白色逐渐变成边缘灰黑，就存在明显暗角。",
      "除亮度外，还要关注边缘信噪比，因为后期提亮会把噪声一起放大。",
    ],
    photoImpact: "这张结果几乎全白，对应相对照度接近 1，表示没有明显暗角。一般情况下，边缘越暗，天空和纯色背景越容易看出四角发黑。",
    remember: "边缘相对照度越接近 1 越均匀",
  },
};

const captions: Record<ViewKey, string> = {
  aperture: "横轴是 F 数，纵轴是 RMS 光斑半径。三条线越低，几何成像越集中。",
  layout: "黑线是镜片表面，彩色线是不同视场的光线，最右侧黑竖线是传感器像面。",
  spot: "红、绿、蓝点表示不同波长光线的落点，依次比较中心、半视场和全视场。",
  mtf: "从左到右依次是中心、半视场和全视场。实线 T 与虚线 S 表示两个方向。",
  distortion: "绿色曲线向负方向偏移，说明越靠近边缘，桶形畸变越明显。",
  vignetting: "图面越白表示相对照度越接近 1。本结果接近均匀照明。",
};

export default function Home() {
  const [aperture, setAperture] = useState<ApertureKey>("2.8");
  const [view, setView] = useState<ViewKey>("aperture");
  const result = experiments[aperture];
  const image = view === "spot" ? result.image : fixedImages[view];
  const guide = conceptGuides[view];

  const apertureTakeaway = useMemo(() => {
    const ratio = result.edge / result.center;
    return `当前 F/${aperture} 的全视场光斑约为中心的 ${ratio.toFixed(1)} 倍，画面边缘仍比中心更难校正。`;
  }, [aperture, result]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#lab" aria-label="返回实验室">
          <span className="brand-mark" aria-hidden="true" />
          <span>DeepLens Lab</span>
        </a>
        <div className="top-meta">
          <span>零基础光学课</span>
          <a href="https://github.com/vccimaging/DeepLens">参考项目</a>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">OPTICAL DESIGN LEARNING LAB</p>
          <h1>看懂一张图，理解一个光学概念。</h1>
          <p className="lede">概念、真实计算图和照片影响放在一起，点击术语就能对照学习。</p>
        </div>
        <div className="intro-note">
          <strong>先做这个实验</strong>
          <p>选择 F/2、F/2.8、F/4，观察进光量、光斑、景深和衍射风险如何一起变化。</p>
        </div>
      </section>

      <section className="lab" id="lab">
        <aside className="controls">
          <div className="control-heading">
            <span>实验控制台</span>
            <span className="status-dot">真实计算数据</span>
          </div>

          <div className="lens-name">
            <span>当前镜头</span>
            <strong>80° 手机广角镜头</strong>
            <p>保持镜片结构、材料和传感器不变，只改变光圈 F 数。</p>
          </div>

          <fieldset>
            <legend>选择光圈，所有结果会同步变化</legend>
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
            <span>F 数公式</span>
            <strong>F 数 = 焦距 ÷ 入瞳直径</strong>
          </div>

          <div className="beginner-note">
            <strong>先记住</strong>
            <p>F 后面的数字越小，光圈开口越大，进入镜头的光越多。</p>
          </div>
        </aside>

        <div className="workspace">
          <div className="metrics" aria-label={`F/${aperture} 的实际计算结果`}>
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

          <div className="concept-picker">
            <h2>选择你想看懂的概念</h2>
            <div className="view-tabs" role="tablist" aria-label="光学概念">
              {views.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === item.key}
                  aria-controls="concept-panel"
                  className={view === item.key ? "active" : ""}
                  key={item.key}
                  onClick={() => setView(item.key)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="learning-stage" id="concept-panel" role="tabpanel">
            <div className="visual-column">
              {view === "aperture" && (
                <section className="aperture-demo" aria-label={`F/${aperture} 光圈开口示意`}>
                  <div className="pupil-stage" aria-hidden="true">
                    <div
                      className="pupil-circle"
                      style={{ transform: `scale(${result.pupilScale})` }}
                    />
                  </div>
                  <div>
                    <span>当前通光开口</span>
                    <strong>F/{aperture}</strong>
                    <p>圆越大，允许通过的光线范围越大。此图只表示相对比例。</p>
                  </div>
                </section>
              )}

              <figure className="visual">
                <img
                  src={image}
                  alt={`${views.find((item) => item.key === view)?.label}的真实计算结果`}
                />
                <figcaption>{captions[view]}</figcaption>
              </figure>
            </div>

            <aside className="concept-guide">
              <span className="guide-kicker">这是什么？</span>
              <h3>{guide.title}</h3>
              <p className="plain-definition">{guide.plain}</p>

              <div className="guide-block">
                <strong>这张图怎么看</strong>
                <ol>
                  {guide.howToRead.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>

              <div className="photo-impact">
                <strong>对照片的影响</strong>
                <p>{guide.photoImpact}</p>
              </div>

              <div className="remember-line">
                <span>一句话记住</span>
                <strong>{guide.remember}</strong>
              </div>
            </aside>
          </div>

          {view === "aperture" && (
            <section className="impact-section" aria-label={`F/${aperture} 对画面的影响`}>
              <div className="impact-heading">
                <h3>F/{aperture} 会同时改变这些结果</h3>
                <p>{result.summary}</p>
              </div>
              <div className="impact-grid">
                <article>
                  <span>相对进光量</span>
                  <strong>{result.relativeLight}</strong>
                  <p>{result.lightLoss}</p>
                </article>
                <article>
                  <span>全视场光斑</span>
                  <strong>{result.edge.toFixed(2)} μm</strong>
                  <p>数值越小，几何光斑越集中</p>
                </article>
                <article>
                  <span>景深</span>
                  <strong>{result.depth}</strong>
                  <p>光圈越小，前后清楚范围通常越大</p>
                </article>
                <article>
                  <span>衍射影响</span>
                  <strong>{result.diffraction}</strong>
                  <p>光圈继续缩小时需要用衍射 MTF 验证</p>
                </article>
              </div>
              <p className="aperture-takeaway">{apertureTakeaway}</p>
            </section>
          )}
        </div>
      </section>

      <section className="lesson">
        <div>
          <h2>光学设计是在多个目标之间找平衡。</h2>
          <p>
            缩小光圈通常能减小几何像差，但会损失进光量。光圈过小时，衍射又会降低细节对比度。
            下一步可以尝试改变镜片曲率、材料和间距，再用点列图、MTF、畸变和渐晕一起评价。
          </p>
        </div>
        <img src="lab/aperture-vs-spot.png" alt="F 数与 RMS 光斑半径的真实计算关系图" />
      </section>

      <footer>
        <span>DeepLens 光学设计学习实验室</span>
        <span>实验数据由 Apple M4 上的 DeepLens 生成</span>
      </footer>
    </main>
  );
}
