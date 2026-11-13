/* 广州造船厂技工学校电工线路连接模拟器 · 电路库
   坐标：SVG viewBox 0 0 400 560
   端子引用格式："元件ID.端子名"
   元件类型：live火线 / neutral零线 / switch单联开关 / switch3双联(单刀双掷)
             switch4中途(双刀双掷) / lamp灯泡 / motor电动机 / buzzer蜂鸣器
             resistor电阻 / inductor镇流器 / coil接触器线圈 / contact接触器触点
             meter电度表 / node接线节点
*/
window.CIRCUITS = [
  // ================= 照明电路 =================
  {
    id: "light1", cat: "light", name: "单开关控制一盏灯", level: 1,
    desc: "一个单联开关控制一盏白炽灯",
    goal: "接线完成后，合上开关 S1，灯泡 EL1 点亮。",
    points: ["火线 L 先进开关，再进灯泡", "零线 N 直接接灯泡另一端", "开关必须串联在火线回路上，保证断开后灯头无电"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 400 },
      { id: "S1", type: "switch", x: 175, y: 150, state: "open" },
      { id: "EL1", type: "lamp", x: 280, y: 290 }
    ],
    wires: [
      ["L.a", "S1.a"], ["S1.b", "EL1.a"], ["EL1.b", "N.a"]
    ],
    explain: "电流路径：火线 L → 开关 S1 → 灯泡 EL1 → 零线 N。合上开关后回路闭合，灯泡点亮；断开开关即可熄灭。这是最基本、最常用的照明接线方式。"
  },

  {
    id: "light7", cat: "light", name: "两盏灯并联", level: 1,
    desc: "两盏灯泡并联接入同一电源，各自独立工作",
    goal: "接线完成后，两盏灯 EL1、EL2 同时点亮，且互不影响。",
    points: ["并联时各灯两端电压相等，均为电源电压", "并联支路互相独立，一盏灯坏不影响另一盏"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 300 },
      { id: "J1", type: "node", x: 150, y: 150 },
      { id: "EL1", type: "lamp", x: 260, y: 110 },
      { id: "EL2", type: "lamp", x: 260, y: 200 },
      { id: "J2", type: "node", x: 150, y: 300 }
    ],
    wires: [
      ["L.a", "J1.a"], ["J1.a", "EL1.a"], ["J1.a", "EL2.a"],
      ["EL1.b", "J2.a"], ["EL2.b", "J2.a"], ["J2.a", "N.a"]
    ],
    explain: "两盏灯并联：火线 L 经节点 J1 分成两条支路分别接两盏灯，再由节点 J2 汇合回到零线 N。并联电路各支路电压相等，两灯均以额定亮度发光。"
  },

  {
    id: "light6", cat: "light", name: "两盏灯串联", level: 1,
    desc: "两盏灯泡串联接入电源，电流依次流过",
    goal: "接线完成后，合上开关 S1，两盏灯串联点亮但亮度变暗。",
    points: ["串联时电流相同，各灯分得部分电压", "串联灯泡会明显变暗，实际照明很少采用"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 300 },
      { id: "S1", type: "switch", x: 165, y: 150, state: "open" },
      { id: "EL1", type: "lamp", x: 260, y: 150 },
      { id: "EL2", type: "lamp", x: 260, y: 260 }
    ],
    wires: [
      ["L.a", "S1.a"], ["S1.b", "EL1.a"], ["EL1.b", "EL2.a"], ["EL2.b", "N.a"]
    ],
    explain: "电流路径：L → S1 → EL1 → EL2 → N。串联电路电流处处相等，两灯各分得约一半电压，因此亮度明显变暗。若其中一盏灯烧坏，整条回路断开，另一盏也熄灭。"
  },

  {
    id: "light4", cat: "light", name: "双开关分别控制两盏灯", level: 1,
    desc: "两个独立开关分别控制两盏灯，互不干扰",
    goal: "接线完成后，合上 S1 点亮 EL1，合上 S2 点亮 EL2，两路独立。",
    points: ["每个开关与其控制的灯串联成独立支路", "两路并联接入电源，互不影响"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 310 },
      { id: "J1", type: "node", x: 120, y: 150 },
      { id: "S1", type: "switch", x: 185, y: 110, state: "open" },
      { id: "S2", type: "switch", x: 185, y: 190, state: "open" },
      { id: "EL1", type: "lamp", x: 300, y: 110 },
      { id: "EL2", type: "lamp", x: 300, y: 190 },
      { id: "J2", type: "node", x: 250, y: 310 }
    ],
    wires: [
      ["L.a", "J1.a"], ["J1.a", "S1.a"], ["J1.a", "S2.a"],
      ["S1.b", "EL1.a"], ["S2.b", "EL2.a"],
      ["EL1.b", "J2.a"], ["EL2.b", "J2.a"], ["J2.a", "N.a"]
    ],
    explain: "火线 L 在 J1 节点分成两路，分别经 S1、S2 控制 EL1、EL2，再由 J2 汇合回零线。两路完全独立，可以各自开合，互不干扰。"
  },

  {
    id: "light5", cat: "light", name: "单开关控制两盏灯（并联）", level: 2,
    desc: "一个开关同时控制两盏并联的灯",
    goal: "接线完成后，合上 S1，EL1、EL2 同时点亮。",
    points: ["开关接在并联支路的公共火线上", "两灯并联，同时受控于一个开关"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 310 },
      { id: "S1", type: "switch", x: 160, y: 150, state: "open" },
      { id: "J1", type: "node", x: 240, y: 150 },
      { id: "EL1", type: "lamp", x: 300, y: 110 },
      { id: "EL2", type: "lamp", x: 300, y: 200 },
      { id: "J2", type: "node", x: 250, y: 310 }
    ],
    wires: [
      ["L.a", "S1.a"], ["S1.b", "J1.a"], ["J1.a", "EL1.a"], ["J1.a", "EL2.a"],
      ["EL1.b", "J2.a"], ["EL2.b", "J2.a"], ["J2.a", "N.a"]
    ],
    explain: "开关 S1 串联在公共火线上，控制点后接节点 J1 分成两路并联到 EL1、EL2。一个开关即可同时控制两盏灯。"
  },

  {
    id: "light2", cat: "light", name: "两地控制一盏灯（双联开关）", level: 2,
    desc: "两个双联开关在两地控制同一盏灯（如楼梯上下）",
    goal: "接线完成后，在任意一处拨动开关，都能点亮或熄灭 EL1。",
    points: ["使用两个单刀双掷（双联）开关", "两开关的两个切换端交叉并联", "任意拨动其中一个开关都会改变回路通断"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 400 },
      { id: "K1", type: "switch3", x: 135, y: 150, state: "up" },
      { id: "K2", type: "switch3", x: 245, y: 150, state: "up" },
      { id: "EL1", type: "lamp", x: 280, y: 300 }
    ],
    wires: [
      ["L.a", "K1.com"], ["K1.l1", "K2.l1"], ["K1.l2", "K2.l2"],
      ["K2.com", "EL1.a"], ["EL1.b", "N.a"]
    ],
    explain: "两个双联开关的公共端分别接火线和灯泡，两个切换端（l1、l2）交叉相连。无论开关处于哪个位置，拨动任意一个开关都能改变灯泡的亮灭状态，实现两地控制。"
  },

  {
    id: "light3", cat: "light", name: "三地控制一盏灯", level: 3,
    desc: "两个双联开关加一个中途开关，在三个地点控制一盏灯",
    goal: "接线完成后，在任意一处拨动开关，都能点亮或熄灭 EL1。",
    points: ["两端用双联开关，中间用双刀双掷（中途）开关", "中途开关的两组触点交叉连接", "任意一处操作都能切换通断"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 420 },
      { id: "K1", type: "switch3", x: 120, y: 150, state: "up" },
      { id: "K3", type: "switch4", x: 200, y: 150, state: "straight" },
      { id: "K2", type: "switch3", x: 285, y: 150, state: "up" },
      { id: "EL1", type: "lamp", x: 250, y: 320 }
    ],
    wires: [
      ["L.a", "K1.com"], ["K1.l1", "K3.in1"], ["K1.l2", "K3.in2"],
      ["K3.out1", "K2.l1"], ["K3.out2", "K2.l2"],
      ["K2.com", "EL1.a"], ["EL1.b", "N.a"]
    ],
    explain: "两端各用一个双联开关，中间插入一个双刀双掷的中途开关。中途开关的两组触点交叉切换，配合两端双联开关实现三个地点任意控制同一盏灯。"
  },

  // ================= 实用电路 =================
  {
    id: "fluor1", cat: "practical", name: "日光灯电路（镇流器+启辉器）", level: 2,
    desc: "电感镇流器式荧光灯（日光灯）的典型接线",
    goal: "接线完成后，点「通电」，灯管 EL1 点亮；闭合启辉器 H 可模拟预热（灯管熄灭）。",
    points: ["镇流器串联在火线上，与灯管串联", "启辉器并联在灯管两端", "启动瞬间启辉器闭合预热，断开后镇流器产生高压点亮灯管"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 410 },
      { id: "Z", type: "inductor", x: 170, y: 150 },
      { id: "EL1", type: "lamp", x: 270, y: 290 },
      { id: "H", type: "switch", x: 270, y: 190, state: "open" },
      { id: "J1", type: "node", x: 240, y: 220 },
      { id: "J2", type: "node", x: 300, y: 340 }
    ],
    wires: [
      ["L.a", "Z.a"], ["Z.b", "J1.a"],
      ["J1.a", "EL1.a"], ["J1.a", "H.a"],
      ["EL1.b", "J2.a"], ["H.b", "J2.a"],
      ["J2.a", "N.a"]
    ],
    explain: "镇流器 Z 串联在火线上，灯管 EL1 与镇流器串联；启辉器 H 并联在灯管两端。启动时启辉器先闭合使灯丝预热，随后断开，镇流器产生感应高压使灯管击穿发光。运行中灯管两端电压下降，镇流器起限流作用。"
  },

  {
    id: "meter1", cat: "practical", name: "单相电度表接线", level: 2,
    desc: "单相有功电度表（电能表）的进线与出线接线",
    goal: "接线完成后，合上开关 S1，电流经电度表流过，灯泡 EL1 点亮。",
    points: ["电度表 1 号端子接火线进线，2 号端子接火线出线", "3 号端子接零线进线，4 号端子接零线出线", "火线进表、零线进表，负载从出线端引出"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 400 },
      { id: "Wh", type: "meter", x: 200, y: 270 },
      { id: "S1", type: "switch", x: 300, y: 160, state: "open" },
      { id: "EL1", type: "lamp", x: 300, y: 280 }
    ],
    wires: [
      ["L.a", "Wh.t1"], ["Wh.t2", "S1.a"], ["S1.b", "EL1.a"],
      ["EL1.b", "Wh.t4"], ["Wh.t3", "N.a"]
    ],
    explain: "单相电度表接线原则「1、3 进，2、4 出」：1 号端子接火线进线，2 号端子接火线出线（去负载），3 号端子接零线进线，4 号端子接零线出线。电流线圈串联在火线上，电压线圈并联在零线间，正确计量负载用电量。"
  },

  {
    id: "fuse1", cat: "practical", name: "熔断器保护照明电路", level: 1,
    desc: "在火线回路中串接熔断器，对线路进行短路保护",
    goal: "接线完成后，合上开关 S1，灯泡 EL1 点亮；发生短路时熔断器熔断保护。",
    points: ["熔断器必须串联在火线上，不能接在零线上", "熔断器额定电流略大于负载电流"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 400 },
      { id: "FU", type: "resistor", x: 170, y: 150, label: "FU 熔断器", r: 1 },
      { id: "S1", type: "switch", x: 280, y: 150, state: "open" },
      { id: "EL1", type: "lamp", x: 280, y: 280 }
    ],
    wires: [
      ["L.a", "FU.a"], ["FU.b", "S1.a"], ["S1.b", "EL1.a"], ["EL1.b", "N.a"]
    ],
    explain: "熔断器 FU 串联在火线 L 上，位于开关之前，对整条线路起短路保护作用。当线路发生短路、电流过大时，熔体熔断切断电源。注意熔断器严禁接在零线上。"
  },

  {
    id: "bell1", cat: "practical", name: "门铃电路（蜂鸣器）", level: 1,
    desc: "一个按钮开关控制一个蜂鸣器（门铃）",
    goal: "接线完成后，按下按钮 S1，蜂鸣器 HA 鸣响。",
    points: ["按钮与蜂鸣器串联", "按钮常开，按下时闭合发声"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 400 },
      { id: "S1", type: "switch", x: 175, y: 150, state: "open" },
      { id: "HA", type: "buzzer", x: 280, y: 280 }
    ],
    wires: [
      ["L.a", "S1.a"], ["S1.b", "HA.a"], ["HA.b", "N.a"]
    ],
    explain: "按钮 S1 与蜂鸣器 HA 串联接入电源。按下按钮时回路闭合，蜂鸣器得电鸣响；松开后断开，停止鸣叫。原理与单开关控制一盏灯相同，只是负载换成了发声器件。"
  },

  {
    id: "dim1", cat: "practical", name: "电阻串联限流（调光）电路", level: 2,
    desc: "灯泡串联电阻以降低亮度、限制电流",
    goal: "接线完成后，合上开关 S1，灯泡 EL1 因串联电阻而变暗点亮。",
    points: ["电阻与灯泡串联分压，灯泡两端电压降低", "串联电阻越大，灯泡越暗"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 400 },
      { id: "S1", type: "switch", x: 165, y: 150, state: "open" },
      { id: "R", type: "resistor", x: 250, y: 150, label: "R", r: 220 },
      { id: "EL1", type: "lamp", x: 280, y: 280 }
    ],
    wires: [
      ["L.a", "S1.a"], ["S1.b", "R.a"], ["R.b", "EL1.a"], ["EL1.b", "N.a"]
    ],
    explain: "电阻 R 与灯泡 EL1 串联。电源电压在电阻和灯泡之间分配，灯泡分得电压降低，因此亮度变暗。串联的电阻越大，灯泡越暗，这就是最简单的调光/限流原理。"
  },

  // ================= 电机控制 =================
  {
    id: "motor1", cat: "motor", name: "点动控制电路", level: 2,
    desc: "按住按钮电动机运转，松开即停（点动）",
    goal: "接线完成后，按下按钮 SB，接触器 KM 吸合，电动机 M 运转；松开后停止。",
    points: ["按钮 SB 与接触器线圈 KM 串联", "主触点受线圈控制，接通电动机主回路", "无自锁环节，松开按钮即断电停机"],
    components: [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 420 },
      { id: "SB", type: "switch", x: 160, y: 150, state: "open" },
      { id: "KM", type: "coil", x: 160, y: 260 },
      { id: "KM1", type: "contact", x: 270, y: 150, ref: "KM", kind: "NO" },
      { id: "M", type: "motor", x: 270, y: 260 }
    ],
    wires: [
      ["L.a", "SB.a"], ["SB.b", "KM.a"], ["KM.b", "N.a"],
      ["L.a", "KM1.a"], ["KM1.b", "M.a"], ["M.b", "N.a"]
    ],
    explain: "控制回路：L → 按钮 SB → 接触器线圈 KM → N；主回路：L → 主触点 KM1 → 电动机 M → N。按住 SB 时线圈得电、主触点闭合、电动机运转；松开 SB 线圈失电、主触点断开、电动机停止，实现「点动」控制。（主回路为教学简化的单相表示，实际电机主回路为三相。）"
  },

  {
    id: "motor2", cat: "motor", name: "自锁连续运转控制", level: 3,
    desc: "启动后松开按钮电动机仍连续运转（自锁）",
    goal: "接线完成后，按下启动按钮 SB2 电动机连续运转，按停止按钮 SB1 停止。",
    points: ["停止按钮 SB1 常闭、启动按钮 SB2 常开，串联接线圈", "辅助常开触点与启动按钮并联，实现自锁", "自锁使线圈在松开启动按钮后仍保持得电"],
    components: [
      { id: "L", type: "live", x: 55, y: 140 },
      { id: "N", type: "neutral", x: 55, y: 430 },
      { id: "SB1", type: "switch", x: 150, y: 140, state: "closed" },
      { id: "A", type: "node", x: 150, y: 200 },
      { id: "SB2", type: "switch", x: 150, y: 260, state: "open" },
      { id: "KM2", type: "contact", x: 235, y: 260, ref: "KM", kind: "NO" },
      { id: "B", type: "node", x: 235, y: 320 },
      { id: "KM", type: "coil", x: 235, y: 380 },
      { id: "KM1", type: "contact", x: 250, y: 110, ref: "KM", kind: "NO" },
      { id: "M", type: "motor", x: 250, y: 190 }
    ],
    wires: [
      ["L.a", "SB1.a"], ["SB1.b", "A.a"],
      ["A.a", "SB2.a"], ["A.a", "KM2.a"],
      ["SB2.b", "B.a"], ["KM2.b", "B.a"],
      ["B.a", "KM.a"], ["KM.b", "N.a"],
      ["L.a", "KM1.a"], ["KM1.b", "M.a"], ["M.b", "N.a"]
    ],
    explain: "控制回路中停止按钮 SB1（常闭）、启动按钮 SB2（常开）与线圈 KM 串联；辅助常开触点 KM2 与启动按钮 SB2 并联形成自锁。按下 SB2 后线圈得电，KM2 闭合锁住回路，即使松开 SB2 电动机仍连续运转；按下 SB1 断开回路，电动机停止。"
  },

  {
    id: "motor3", cat: "motor", name: "接触器互锁正反转控制", level: 3,
    desc: "两个接触器分别控制电动机正转与反转，并互相联锁",
    goal: "接线完成后，按正转按钮 SB2 电动机运转，按反转按钮 SB3 电动机运转；常闭触点互锁防止两接触器同时吸合。",
    points: ["正反转由两个接触器分别控制，常闭辅助触点实现电气互锁", "互锁保证正反转接触器不会同时吸合造成短路", "实际三相电机通过交换任意两相实现反转（此处为单相教学简化表示）"],
    components: [
      { id: "L", type: "live", x: 55, y: 130 },
      { id: "N", type: "neutral", x: 55, y: 440 },
      { id: "SB1", type: "switch", x: 150, y: 130, state: "closed" },
      { id: "A", type: "node", x: 150, y: 190 },
      { id: "SB2", type: "switch", x: 150, y: 250, state: "open" },
      { id: "SB3", type: "switch", x: 150, y: 310, state: "open" },
      { id: "KM2b", type: "contact", x: 215, y: 250, ref: "KM2", kind: "NC" },
      { id: "KM1b", type: "contact", x: 215, y: 310, ref: "KM1", kind: "NC" },
      { id: "KM1", type: "coil", x: 300, y: 250 },
      { id: "KM2", type: "coil", x: 300, y: 310 },
      { id: "KM1a", type: "contact", x: 270, y: 120, ref: "KM1", kind: "NO" },
      { id: "KM2a", type: "contact", x: 270, y: 180, ref: "KM2", kind: "NO" },
      { id: "M", type: "motor", x: 270, y: 300 }
    ],
    wires: [
      ["L.a", "SB1.a"], ["SB1.b", "A.a"],
      ["A.a", "SB2.a"], ["A.a", "SB3.a"],
      ["SB2.b", "KM2b.a"], ["KM2b.b", "KM1.a"],
      ["SB3.b", "KM1b.a"], ["KM1b.b", "KM2.a"],
      ["KM1.b", "N.a"], ["KM2.b", "N.a"],
      ["L.a", "KM1a.a"], ["KM1a.b", "M.a"],
      ["L.a", "KM2a.a"], ["KM2a.b", "M.a"],
      ["M.b", "N.a"]
    ],
    explain: "正转支路：SB1（停止）→ SB2（正转）→ 常闭触点 KM2b → 线圈 KM1；反转支路：SB1 → SB3（反转）→ 常闭触点 KM1b → 线圈 KM2。当 KM1 吸合时其常闭触点 KM1b 断开，切断反转支路，实现电气互锁，防止两接触器同时吸合造成短路。主触点 KM1a/KM2a 接通电动机主回路。（实际三相电机交换两相实现反转，此处为单相教学简化。）"
  },

  {
    id: "motor4", cat: "motor", name: "两地控制一台电动机", level: 2,
    desc: "在两个地点都能启动、停止同一台电动机",
    goal: "接线完成后，任意地点的启动按钮都能启动电动机，任意地点的停止按钮都能停止。",
    points: ["两个停止按钮串联、两个启动按钮并联", "停止按钮常闭串联，任一按下即可停车", "启动按钮常开并联，任一按下即可启动"],
    components: [
      { id: "L", type: "live", x: 55, y: 130 },
      { id: "N", type: "neutral", x: 55, y: 430 },
      { id: "SB1", type: "switch", x: 150, y: 130, state: "closed" },
      { id: "SB2", type: "switch", x: 230, y: 130, state: "closed" },
      { id: "A", type: "node", x: 150, y: 200 },
      { id: "SB3", type: "switch", x: 150, y: 260, state: "open" },
      { id: "SB4", type: "switch", x: 240, y: 260, state: "open" },
      { id: "B", type: "node", x: 240, y: 320 },
      { id: "KM", type: "coil", x: 240, y: 380 },
      { id: "KM1", type: "contact", x: 250, y: 100, ref: "KM", kind: "NO" },
      { id: "M", type: "motor", x: 250, y: 60 }
    ],
    wires: [
      ["L.a", "SB1.a"], ["SB1.b", "SB2.a"], ["SB2.b", "A.a"],
      ["A.a", "SB3.a"], ["A.a", "SB4.a"],
      ["SB3.b", "B.a"], ["SB4.b", "B.a"],
      ["B.a", "KM.a"], ["KM.b", "N.a"],
      ["L.a", "KM1.a"], ["KM1.b", "M.a"], ["M.b", "N.a"]
    ],
    explain: "两地控制：两个停止按钮 SB1、SB2 串联（任一按下即可断开），两个启动按钮 SB3、SB4 并联（任一按下即可启动）。任一地点都可实现启动与停止，常用于需要在多个位置操作的设备。"
  }
];
