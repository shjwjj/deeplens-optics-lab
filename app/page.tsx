"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ApertureKey = "2.0" | "2.8" | "4.0";
type ViewKey = "aperture" | "layout" | "spot" | "mtf" | "distortion" | "vignetting";
type ImagingCaseKey = "aperture" | "spot" | "mtf" | "distortion" | "vignetting";

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

type ImagingCase = {
  label: string;
  scene: string;
  title: string;
  intro: string;
  control: string;
  low: string;
  high: string;
  initial: number;
  format: (amount: number) => string;
  chartTitle: string;
  chartIntro: string;
  chartSummary: (amount: number) => string;
  cause: string;
  lookFor: string[];
  takeaway: string;
};

const imagingCases: Record<ImagingCaseKey, ImagingCase> = {
  aperture: {
    label: "光圈与景深",
    scene: "对焦人物约 2 m",
    title: "焦点锁定人物后，光圈怎样改变前后景深？",
    intro: "对焦位置始终在人物，不是画面中间。把光圈开大，人物仍清楚，但更远的建筑和更近的地面会更快离开清晰范围。",
    control: "拖动光圈",
    low: "F/8 背景较清楚",
    high: "F/2 背景更虚化",
    initial: 0.78,
    format: (amount) => `F/${(8 - amount * 6).toFixed(1)}`,
    chartTitle: "人物与背景的离焦 MTF",
    chartIntro: "人物焦点保持在约 2 m。这里只演示不同物距的离焦，不评价镜头本身的在焦像差。",
    chartSummary: (amount) => `F/${(8 - amount * 6).toFixed(1)}：人物曲线保持较高，背景曲线${amount < 0.34 ? "与人物较接近" : amount < 0.67 ? "开始明显降低" : "在中高频明显降低"}。`,
    cause: "对焦决定最清晰的物距，光圈决定这个物距前后有多大范围看起来清晰。大光圈让焦点前后的弥散圆增长更快，所以景深变浅。",
    lookFor: ["人物眼睛和手中线条板保持清楚", "后方窗框与更近的地面逐渐变软", "左右变虚是因为那里主要是远处背景，不是因为它们位于画面两侧"],
    takeaway: "对焦选择清晰位置，光圈调整这个位置前后的清晰范围。若快门和 ISO 不变，大光圈还会让画面更亮。",
  },
  spot: {
    label: "点列图",
    scene: "夜景光点",
    title: "为什么画面边缘的路灯会长出小尾巴？",
    intro: "观察左右路灯和窗内小灯。点像不能集中时，一个圆点会散成翅膀、彗尾或彩色边缘。",
    control: "拖动光斑扩散",
    low: "点像集中",
    high: "边缘明显拉尾",
    initial: 0.68,
    format: (amount) => (amount < 0.34 ? "光斑集中" : amount < 0.67 ? "开始拉尾" : "边缘明显彗尾"),
    chartTitle: "边缘视场点列图",
    chartIntro: "每个彩色点是一条光线在像面上的落点。点云大小与方向会同步反映在路灯的形状上。",
    chartSummary: (amount) => `教学示意：点云${amount < 0.34 ? "紧贴中心" : amount < 0.67 ? "开始扩大并失去对称" : "明显扩大并沿离轴方向拉尾"}。`,
    cause: "点列图里的点云就是这些光线的落点。边缘点云越大、形状越不对称，照片里的小灯越容易拉成长尾。",
    lookFor: ["先看画面左右两侧的大路灯", "再看建筑内部的小点光源", "比较中心灯点与边缘灯点的形状"],
    takeaway: "点列图不是抽象散点。它直接预告星点、路灯和高光在照片里会长成什么样。",
  },
  mtf: {
    label: "MTF",
    scene: "文字与纹理",
    title: "为什么照片看着不糊，却没有细节？",
    intro: "观察人物手中的线条板、头发、衣服和地砖。MTF 降低时，粗轮廓还在，细线之间的黑白差异却会消失。",
    control: "拖动细节传递",
    low: "高频对比度高",
    high: "高频对比度低",
    initial: 0.56,
    format: (amount) => (amount < 0.34 ? "细节传递较好" : amount < 0.67 ? "细纹开始变软" : "细纹难以分辨"),
    chartTitle: "MTF 随空间频率变化",
    chartIntro: "曲线右侧代表更细的纹理。曲线在右侧下降时，线条板、头发和远处窗框最先失去对比度。",
    chartSummary: (amount) => `教学示意：40 lp/mm 附近的对比度约为 ${Math.max(0.08, 0.6 * (1 - amount * 0.64)).toFixed(2)}，曲线越低，细纹越难分开。`,
    cause: "MTF 描述不同粗细纹理的对比度还能保留多少。高频 MTF 低时，相邻细线会混在一起，但大楼和人物轮廓仍然存在。",
    lookFor: ["手中线条板的细线是否还能分开", "头发和衣服纹理是否变成一片", "远处窗框的边缘是否失去干脆感"],
    takeaway: "锐度不只是有没有边缘，还要看细小纹理保留了多少对比度。",
  },
  distortion: {
    label: "畸变",
    scene: "建筑直线",
    title: "为什么建筑窗框会向外鼓？",
    intro: "观察楼体外沿、窗框和地砖。畸变会改变它们在画面中的位置，让直线弯曲，但局部纹理仍可能很清楚。",
    control: "拖动桶形畸变",
    low: "0% 直线保持笔直",
    high: "-16% 边缘明显外鼓",
    initial: 0.62,
    format: (amount) => `${(-16 * amount).toFixed(1)}% 桶形（教学示意）`,
    chartTitle: "畸变随视场变化",
    chartIntro: "画面中心在曲线左侧，边缘在右侧。曲线越向负值偏离 0，建筑边缘越向外鼓。",
    chartSummary: (amount) => `教学示意：全视场畸变为 ${(-16 * amount).toFixed(1)}%，中心接近 0，边缘位置偏移最大。`,
    cause: "不同视场的放大率不一致。越靠近画面边缘，物体位置偏移越多，于是本来笔直的线会弯成弧线。",
    lookFor: ["楼体左右外沿是否变成弧线", "窗框的横线是否向外鼓", "人物细节仍可清楚，但位置已经改变"],
    takeaway: "畸变主要改变形状和位置，不等于照片失焦。软件能校正，但通常需要裁切和插值。",
  },
  vignetting: {
    label: "渐晕",
    scene: "天空与白墙",
    title: "为什么照片中心正常，四角却发暗？",
    intro: "观察均匀天空和建筑四角。边缘收到的光减少后，中心曝光正常，四角仍会逐渐变暗。",
    control: "拖动边缘照度",
    low: "相对照度 1.00",
    high: "相对照度 0.35",
    initial: 0.66,
    format: (amount) => `边缘相对照度 ${(1 - amount * 0.65).toFixed(2)}（教学示意）`,
    chartTitle: "相对照度随视场变化",
    chartIntro: "画面中心在曲线左侧，边缘在右侧。曲线右端越低，照片四角收到的光越少。",
    chartSummary: (amount) => `教学示意：中心相对照度为 1.00，全视场下降到 ${(1 - amount * 0.65).toFixed(2)}。`,
    cause: "斜着进入镜头的边缘光线更容易被镜筒和光阑遮挡，自然照度也会下降，所以传感器四角接收到的能量更少。",
    lookFor: ["先比较天空中心与四角亮度", "再看左右建筑边缘是否一起变暗", "注意后期提亮四角会同时放大噪声"],
    takeaway: "渐晕主要影响画面亮度均匀性。拍天空、白墙和扫描文档时尤其容易发现。",
  },
};

const simulationSize = { width: 960, height: 640 };
let distortionSourceCache: ImageData | null = null;

function drawBaseImage(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  context.drawImage(image, 0, 0, simulationSize.width, simulationSize.height);
}

function drawSimulation(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  caseKey: ImagingCaseKey,
  amount: number,
) {
  const { width, height } = simulationSize;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: caseKey === "distortion" });
  if (!context) return;

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (caseKey === "aperture") {
    context.save();
    context.filter = `blur(${(amount * 8).toFixed(1)}px) brightness(${(1 + amount * 0.05).toFixed(2)})`;
    drawBaseImage(context, image);
    context.restore();

    const sharpLayer = document.createElement("canvas");
    sharpLayer.width = width;
    sharpLayer.height = height;
    const sharpContext = sharpLayer.getContext("2d");
    if (!sharpContext) return;
    drawBaseImage(sharpContext, image);
    const maskLayer = document.createElement("canvas");
    maskLayer.width = width;
    maskLayer.height = height;
    const maskContext = maskLayer.getContext("2d");
    if (!maskContext) return;
    maskContext.filter = `blur(${(5 + amount * 5).toFixed(1)}px)`;
    maskContext.fillStyle = "rgba(255,255,255,1)";
    maskContext.beginPath();
    maskContext.ellipse(width * 0.5, height * 0.34, width * 0.055, height * 0.075, 0, 0, Math.PI * 2);
    maskContext.fill();
    maskContext.fillRect(width * 0.425, height * 0.42, width * 0.15, height * 0.16);
    maskContext.beginPath();
    maskContext.moveTo(width * 0.445, height * 0.4);
    maskContext.quadraticCurveTo(width * 0.405, height * 0.47, width * 0.435, height * 0.59);
    maskContext.lineTo(width * 0.46, height * 0.64);
    maskContext.lineTo(width * 0.46, height * 0.94);
    maskContext.lineTo(width * 0.495, height * 0.94);
    maskContext.lineTo(width * 0.5, height * 0.66);
    maskContext.lineTo(width * 0.505, height * 0.94);
    maskContext.lineTo(width * 0.54, height * 0.94);
    maskContext.lineTo(width * 0.54, height * 0.64);
    maskContext.lineTo(width * 0.565, height * 0.59);
    maskContext.quadraticCurveTo(width * 0.595, height * 0.47, width * 0.555, height * 0.4);
    maskContext.closePath();
    maskContext.fill();
    sharpContext.globalCompositeOperation = "destination-in";
    sharpContext.drawImage(maskLayer, 0, 0);
    context.drawImage(sharpLayer, 0, 0);
    return;
  }

  if (caseKey === "mtf") {
    context.save();
    context.filter = `blur(${(amount * 4.8).toFixed(1)}px) contrast(${(1 - amount * 0.34).toFixed(2)})`;
    drawBaseImage(context, image);
    context.restore();
    return;
  }

  if (caseKey === "distortion") {
    if (!distortionSourceCache) {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return;
      drawBaseImage(sourceContext, image);
      distortionSourceCache = sourceContext.getImageData(0, 0, width, height);
    }

    const source = distortionSourceCache.data;
    const output = context.createImageData(width, height);
    const target = output.data;
    for (let y = 0; y < height; y += 1) {
      const normalizedY = (y / (height - 1)) * 2 - 1;
      for (let x = 0; x < width; x += 1) {
        const normalizedX = (x / (width - 1)) * 2 - 1;
        const radiusSquared = normalizedX * normalizedX + normalizedY * normalizedY;
        const factor = 1 - amount * 0.18 * radiusSquared;
        const sourceX = Math.max(0, Math.min(width - 1, Math.round(((normalizedX * factor + 1) / 2) * (width - 1))));
        const sourceY = Math.max(0, Math.min(height - 1, Math.round(((normalizedY * factor + 1) / 2) * (height - 1))));
        const sourceIndex = (sourceY * width + sourceX) * 4;
        const targetIndex = (y * width + x) * 4;
        target[targetIndex] = source[sourceIndex];
        target[targetIndex + 1] = source[sourceIndex + 1];
        target[targetIndex + 2] = source[sourceIndex + 2];
        target[targetIndex + 3] = 255;
      }
    }
    context.putImageData(output, 0, 0);
    return;
  }

  drawBaseImage(context, image);

  if (caseKey === "vignetting") {
    const vignette = context.createRadialGradient(width * 0.5, height * 0.48, width * 0.12, width * 0.5, height * 0.5, width * 0.72);
    vignette.addColorStop(0, "rgba(9,14,18,0)");
    vignette.addColorStop(0.5, `rgba(9,14,18,${(amount * 0.08).toFixed(2)})`);
    vignette.addColorStop(1, `rgba(9,14,18,${(amount * 0.82).toFixed(2)})`);
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
    return;
  }

  if (caseKey === "spot") {
    const pointLights = [
      { x: 0.07, y: 0.37, size: 1.25 },
      { x: 0.93, y: 0.37, size: 1.25 },
      { x: 0.3, y: 0.51, size: 0.72 },
      { x: 0.73, y: 0.51, size: 0.72 },
      { x: 0.18, y: 0.6, size: 0.46 },
      { x: 0.84, y: 0.6, size: 0.46 },
    ];
    context.save();
    context.globalCompositeOperation = "screen";
    pointLights.forEach((light) => {
      const x = width * light.x;
      const y = height * light.y;
      const angle = Math.atan2(y - height * 0.5, x - width * 0.5);
      const tailLength = amount * 48 * light.size;
      const channelColors = ["rgba(235,70,52,0.34)", "rgba(80,190,102,0.3)", "rgba(55,118,232,0.36)"];
      channelColors.forEach((color, channelIndex) => {
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.translate(channelIndex * amount * 3 - amount * 3, 0);
        context.beginPath();
        context.ellipse(tailLength * 0.38, 0, 8 + tailLength, 5 + amount * 13, 0, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
        context.restore();
      });
    });
    context.restore();
  }
}

type PlotBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type PlotTheme = {
  ink: string;
  muted: string;
  line: string;
  accent: string;
  panel: string;
};

const engineeringChartSize = { width: 720, height: 520 };
const chartPlot: PlotBounds = { left: 74, top: 68, width: 604, height: 350 };

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function readPlotTheme(canvas: HTMLCanvasElement): PlotTheme {
  const style = window.getComputedStyle(canvas);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    ink: read("--ink", "#17212b"),
    muted: read("--muted", "#5e6972"),
    line: read("--line", "#d7dee2"),
    accent: read("--accent", "#b94729"),
    panel: read("--panel", "#ffffff"),
  };
}

function drawPlotFrame(
  context: CanvasRenderingContext2D,
  theme: PlotTheme,
  yLabels: string[],
  xLabels: string[],
  yTitle: string,
  xTitle: string,
) {
  const { left, top, width, height } = chartPlot;
  context.fillStyle = theme.panel;
  context.fillRect(0, 0, engineeringChartSize.width, engineeringChartSize.height);
  context.lineWidth = 1.4;
  context.strokeStyle = theme.line;
  context.setLineDash([]);

  for (let index = 0; index < 5; index += 1) {
    const x = left + (width * index) / 4;
    const y = top + (height * index) / 4;
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, top + height);
    context.stroke();
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(left + width, y);
    context.stroke();
  }

  context.fillStyle = theme.muted;
  context.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.textBaseline = "middle";
  yLabels.forEach((label, index) => {
    context.textAlign = "right";
    context.fillText(label, left - 14, top + (height * index) / 4);
  });
  xLabels.forEach((label, index) => {
    context.textAlign = "center";
    context.fillText(label, left + (width * index) / 4, top + height + 26);
  });

  context.fillStyle = theme.ink;
  context.font = '600 20px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.textAlign = "left";
  context.fillText(yTitle, left, 34);
  context.textAlign = "center";
  context.fillText(xTitle, left + width / 2, engineeringChartSize.height - 24);
}

function drawCurve(
  context: CanvasRenderingContext2D,
  values: (position: number) => number,
  color: string,
  dashed = false,
) {
  const { left, top, width, height } = chartPlot;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.setLineDash(dashed ? [12, 10] : []);
  context.beginPath();
  for (let index = 0; index <= 100; index += 1) {
    const position = index / 100;
    const x = left + position * width;
    const y = top + (1 - clamp(values(position))) * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
  context.restore();
}

function drawLegend(
  context: CanvasRenderingContext2D,
  theme: PlotTheme,
  items: Array<{ label: string; color: string; dashed?: boolean }>,
) {
  const startX = chartPlot.left + 12;
  const y = chartPlot.top + 22;
  let cursor = startX;
  context.font = '17px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.textBaseline = "middle";
  items.forEach((item) => {
    context.save();
    context.strokeStyle = item.color;
    context.lineWidth = 4;
    context.setLineDash(item.dashed ? [9, 7] : []);
    context.beginPath();
    context.moveTo(cursor, y);
    context.lineTo(cursor + 32, y);
    context.stroke();
    context.restore();
    context.fillStyle = theme.ink;
    context.textAlign = "left";
    context.fillText(item.label, cursor + 42, y);
    cursor += 42 + context.measureText(item.label).width + 28;
  });
}

function mtfResponse(position: number, amount: number, directionalLoss = 0) {
  const base = 0.98 - 0.5 * Math.pow(position, 1.2);
  const loss = 1 - amount * (0.1 + 0.72 * Math.pow(position, 1.3));
  return clamp(base * loss - directionalLoss * amount * position, 0.04, 1);
}

function drawEngineeringChart(canvas: HTMLCanvasElement, caseKey: ImagingCaseKey, amount: number) {
  canvas.width = engineeringChartSize.width;
  canvas.height = engineeringChartSize.height;
  const context = canvas.getContext("2d");
  if (!context) return;
  const theme = readPlotTheme(canvas);
  context.clearRect(0, 0, engineeringChartSize.width, engineeringChartSize.height);

  if (caseKey === "aperture") {
    drawPlotFrame(context, theme, ["1.0", "0.75", "0.50", "0.25", "0"], ["0", "12.5", "25", "37.5", "50"], "MTF", "空间频率 lp/mm");
    const subject = (position: number) => clamp(0.97 - 0.38 * Math.pow(position, 1.25) - amount * 0.06 * position, 0.08, 1);
    const background = (position: number) => clamp((0.92 - 0.42 * Math.pow(position, 1.2)) * (1 - amount * (0.58 + 0.24 * position)), 0.03, 1);
    drawCurve(context, subject, theme.accent);
    drawCurve(context, background, theme.muted, true);
    drawLegend(context, theme, [
      { label: "人物约 2 m", color: theme.accent },
      { label: "背景约 8 m", color: theme.muted, dashed: true },
    ]);
    return;
  }

  if (caseKey === "spot") {
    drawPlotFrame(context, theme, ["+30", "+15", "0", "-15", "-30"], ["-30", "-15", "0", "+15", "+30"], "像面 Y（教学尺度）", "像面 X（教学尺度）");
    const centerX = chartPlot.left + chartPlot.width / 2;
    const centerY = chartPlot.top + chartPlot.height / 2;
    const channelColors = ["rgba(214,72,54,0.78)", "rgba(63,143,87,0.72)", "rgba(51,107,200,0.74)"];
    const spread = 5 + amount * 38;
    channelColors.forEach((color, channelIndex) => {
      context.fillStyle = color;
      for (let index = 0; index < 56; index += 1) {
        const turn = index * 2.399 + channelIndex * 0.56;
        const radius = spread * (0.16 + ((index * 13) % 53) / 53);
        const tail = amount * 88 * Math.pow(index / 55, 1.7);
        const x = centerX + Math.cos(turn) * radius * 0.72 + tail + (channelIndex - 1) * amount * 8;
        const y = centerY + Math.sin(turn) * radius * (0.62 + amount * 0.36);
        context.beginPath();
        context.arc(x, y, 3.3, 0, Math.PI * 2);
        context.fill();
      }
    });
    context.fillStyle = theme.ink;
    context.font = '17px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.textAlign = "left";
    context.fillText("红、绿、蓝表示不同波长", chartPlot.left + 14, chartPlot.top + 22);
    return;
  }

  if (caseKey === "mtf") {
    drawPlotFrame(context, theme, ["1.0", "0.75", "0.50", "0.25", "0"], ["0", "12.5", "25", "37.5", "50"], "MTF", "空间频率 lp/mm");
    drawCurve(context, (position) => mtfResponse(position, amount), theme.accent);
    drawCurve(context, (position) => mtfResponse(position, amount, 0.09), theme.muted, true);
    drawLegend(context, theme, [
      { label: "T 切向", color: theme.accent },
      { label: "S 弧矢", color: theme.muted, dashed: true },
    ]);
    return;
  }

  if (caseKey === "distortion") {
    drawPlotFrame(context, theme, ["0", "-4", "-8", "-12", "-16"], ["中心 0", "0.25", "0.50", "0.75", "边缘 1"], "畸变 (%)", "归一化视场");
    drawCurve(context, () => 1, theme.muted, true);
    drawCurve(context, (position) => 1 - (amount * Math.pow(position, 2.2)), theme.accent);
    drawLegend(context, theme, [
      { label: "0% 基准", color: theme.muted, dashed: true },
      { label: "当前桶形", color: theme.accent },
    ]);
    return;
  }

  drawPlotFrame(context, theme, ["1.0", "0.84", "0.68", "0.51", "0.35"], ["中心 0", "0.25", "0.50", "0.75", "边缘 1"], "相对照度", "归一化视场");
  drawCurve(context, () => 1, theme.muted, true);
  drawCurve(context, (position) => 1 - amount * 0.65 * Math.pow(position, 2.4), theme.accent);
  drawLegend(context, theme, [
    { label: "均匀照度", color: theme.muted, dashed: true },
    { label: "当前照度", color: theme.accent },
  ]);
}

function ImagingCases() {
  const [activeCase, setActiveCase] = useState<ImagingCaseKey>("aperture");
  const [sceneStatus, setSceneStatus] = useState<"loading" | "ready" | "error">("loading");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLOutputElement>(null);
  const chartOutputRef = useRef<HTMLOutputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentCase = imagingCases[activeCase];

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      imageRef.current = image;
      setSceneStatus("ready");
    };
    image.onerror = () => {
      if (active) setSceneStatus("error");
    };
    image.src = "lab/optics-test-scene.png";
    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  useEffect(() => {
    const amount = currentCase.initial;
    if (sliderRef.current) sliderRef.current.value = String(amount * 100);
    if (outputRef.current) outputRef.current.textContent = currentCase.format(amount);
    if (chartOutputRef.current) chartOutputRef.current.textContent = currentCase.chartSummary(amount);
    if (chartCanvasRef.current) drawEngineeringChart(chartCanvasRef.current, activeCase, amount);
    if (sceneStatus === "ready" && canvasRef.current && imageRef.current) {
      drawSimulation(canvasRef.current, imageRef.current, activeCase, amount);
    }
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeCase, currentCase, sceneStatus]);

  const updateStrength = (amount: number) => {
    if (outputRef.current) outputRef.current.textContent = currentCase.format(amount);
    if (chartOutputRef.current) chartOutputRef.current.textContent = currentCase.chartSummary(amount);
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      if (canvasRef.current && imageRef.current) {
        drawSimulation(canvasRef.current, imageRef.current, activeCase, amount);
      }
      if (chartCanvasRef.current) {
        drawEngineeringChart(chartCanvasRef.current, activeCase, amount);
      }
    });
  };

  return (
    <section className="imaging-cases" id="imaging-cases">
      <header className="case-intro">
        <h2>照片怎么变，工程图就怎么变。</h2>
        <p>拖动同一个参数，左边看照片，右边看对应的 MTF、点列图、畸变或渐晕曲线。</p>
      </header>

      <div className="case-tabs" role="tablist" aria-label="成像案例">
        {(Object.keys(imagingCases) as ImagingCaseKey[]).map((caseKey) => {
          const item = imagingCases[caseKey];
          return (
            <button
              key={caseKey}
              id={`case-tab-${caseKey}`}
              type="button"
              role="tab"
              aria-selected={activeCase === caseKey}
              aria-controls="imaging-case-panel"
              className={activeCase === caseKey ? "active" : ""}
              onClick={() => setActiveCase(caseKey)}
            >
              <strong>{item.label}</strong>
              <span>{item.scene}</span>
            </button>
          );
        })}
      </div>

      <div
        className="case-workbench"
        id="imaging-case-panel"
        role="tabpanel"
        aria-labelledby={`case-tab-${activeCase}`}
      >
        <div className="case-visual-area">
          <div className="case-heading">
            <span>{currentCase.scene}</span>
            <h3>{currentCase.title}</h3>
            <p>{currentCase.intro}</p>
          </div>

          <div className="case-linked-visuals">
            <figure className="case-simulation">
              <div className="case-figure-heading">
                <span>成像结果</span>
                <strong>照片里发生了什么</strong>
              </div>
              <div className="case-canvas-shell">
                {sceneStatus === "loading" && (
                  <div className="case-loading" role="status">
                    <strong>正在准备教学场景</strong>
                    <span>建筑直线、人物、纹理和点光源会同时出现</span>
                  </div>
                )}
                {sceneStatus === "error" && (
                  <div className="case-error" role="alert">
                    <strong>教学场景暂时没有加载成功</strong>
                    <span>请刷新页面后重试</span>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className={sceneStatus === "ready" ? "ready" : ""}
                  role="img"
                  aria-label={`${currentCase.scene}的${currentCase.label}成像效果模拟`}
                />
              </div>
              <figcaption>
                {activeCase === "aperture"
                  ? "焦点锁定人物约 2 m。清晰度按物距变化，不按画面左右位置变化。"
                  : "照片效果与右侧工程图使用同一个教学参数同步变化。"}
              </figcaption>
            </figure>

            <figure className="engineering-figure">
              <div className="case-figure-heading">
                <span>工程图同步变化</span>
                <strong>{currentCase.chartTitle}</strong>
              </div>
              <p>{currentCase.chartIntro}</p>
              <div className="engineering-canvas-shell">
                <canvas
                  ref={chartCanvasRef}
                  role="img"
                  aria-label={`${currentCase.chartTitle}的动态教学示意图`}
                />
              </div>
              <output ref={chartOutputRef} className="engineering-summary">
                {currentCase.chartSummary(currentCase.initial)}
              </output>
              <figcaption>动态曲线用于建立直觉，数值标注为教学示意。真实设计仍需使用光学模型计算。</figcaption>
            </figure>
          </div>

          <div className="case-baseline">
            <img src="lab/optics-test-scene.png" alt="没有附加像差效果的原始基准场景" />
            <div>
              <strong>原始基准</strong>
              <p>建筑线条笔直、四角均匀、点光源集中，人物和背景都保持清楚。用它和上方模拟画面对照。</p>
            </div>
          </div>
        </div>

        <aside className="case-teaching-panel">
          <div className="case-control">
            <label htmlFor="case-strength">{currentCase.control}</label>
            <output ref={outputRef} htmlFor="case-strength" aria-live="polite">
              {currentCase.format(currentCase.initial)}
            </output>
            <input
              key={activeCase}
              ref={sliderRef}
              id="case-strength"
              type="range"
              min="0"
              max="100"
              step="1"
              defaultValue={currentCase.initial * 100}
              onInput={(event) => updateStrength(Number(event.currentTarget.value) / 100)}
            />
            <div className="case-range-labels" aria-hidden="true">
              <span>{currentCase.low}</span>
              <span>{currentCase.high}</span>
            </div>
          </div>

          <section className="case-principle">
            <strong>为什么会这样</strong>
            <p>{currentCase.cause}</p>
          </section>

          <section className="case-observe">
            <strong>请观察三处</strong>
            <ol>
              {currentCase.lookFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <div className="case-takeaway">
            <span>带回拍摄现场</span>
            <strong>{currentCase.takeaway}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

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
          <a href="#imaging-cases">成像案例</a>
          <a href="https://github.com/vccimaging/DeepLens">参考项目</a>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">OPTICAL DESIGN LEARNING LAB</p>
          <h1>看懂一张图，理解一个光学概念。</h1>
          <p className="lede">先看真实场景里的成像变化，再用计算图找到它背后的光学原因。</p>
        </div>
        <div className="intro-note">
          <strong>小白建议从这里开始</strong>
          <p>先拖动下方五个成像案例，再进入实验控制台查看点列图、MTF 和真实计算结果。</p>
        </div>
      </section>

      <ImagingCases />

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
