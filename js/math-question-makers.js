(function () {
  function create(deps = {}) {
    const {
      baseQuestion,
      clamp,
      formatAnswer,
      pick,
      rand,
      round1,
      shuffle,
      simplifyFraction,
      state,
      verticalSpecFromText
    } = deps;

    function makeSupplementalQuestion(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const templates = {
        addsub: [
          () => {
            const cap = grade === 1 ? 20 : grade === 2 ? 100 : grade === 3 ? 1000 : grade === 4 ? 10000 : grade === 5 ? 100000 : 1000000;
            const a = rand(Math.max(3, Math.floor(cap * 0.08)), Math.max(12, Math.floor(cap * (0.18 + level * 0.05))));
            const b = rand(2, Math.max(8, Math.floor(a * 0.6)));
            return baseQuestion(point, {
              text: `在 ${a} 后面再加 ${b}，结果是多少？`,
              answer: a + b,
              word: true,
              explanation: `"再加"就是加法。把原来的 ${a} 和新增加的 ${b} 合起来，${a} + ${b} = ${a + b}。`,
              steps: [`原来有 ${a}。`, `又增加 ${b}。`, `合起来是 ${a + b}。`]
            });
          },
          () => {
            const total = grade === 1 ? rand(12, 20) : rand(45, 90 + grade * 80);
            const left = rand(3, Math.floor(total / 2));
            return baseQuestion(point, {
              text: `${total} - ? = ${left}`,
              answer: total - left,
              explanation: `被减数是 ${total}，结果是 ${left}，要求减去了多少，用 ${total} - ${left}。`,
              steps: [`看成缺少的减数。`, `${total} - ${left} = ${total - left}。`]
            });
          }
        ],
        compare: [
          () => {
            const a = rand(8, 28 + grade * 12);
            const diff = rand(2, 8 + level * 3);
            return baseQuestion(point, {
              text: `白色金吉拉有 ${a} 张卡片，小朋友比它多 ${diff} 张。小朋友有多少张？`,
              answer: a + diff,
              word: true,
              explanation: `"比它多 ${diff} 张"就是在 ${a} 的基础上加 ${diff}。`,
              steps: [`金吉拉有 ${a} 张。`, `小朋友多 ${diff} 张。`, `${a} + ${diff} = ${a + diff} 张。`]
            });
          },
          () => {
            const a = rand(10, 50 + grade * 15);
            const b = a + rand(3, 18);
            return baseQuestion(point, {
              text: `${a}、${b}、${b - rand(1, 4)} 这三个数里，最小的数是多少？`,
              answer: a,
              word: true,
              explanation: `比较大小时先看高位，三个数中 ${a} 最小。`,
              steps: [`把三个数从小到大比较。`, `最小的是 ${a}。`]
            });
          }
        ],
        muldiv: [
          () => {
            if (grade === 1) return null;
            const groups = rand(2, grade <= 2 ? 9 : 16);
            const each = rand(2, grade <= 2 ? 9 : 24);
            return baseQuestion(point, {
              text: `每组 ${each} 个练习章，有 ${groups} 组，一共有多少个？`,
              answer: each * groups,
              word: true,
              explanation: `每组一样多，求一共多少，用乘法。${each} × ${groups} = ${each * groups}。`,
              steps: [`每组 ${each} 个。`, `有 ${groups} 组。`, `${each} × ${groups} = ${each * groups}。`]
            });
          },
          () => {
            if (grade === 1) return null;
            const each = rand(2, 9 + level);
            const groups = rand(3, 12);
            return baseQuestion(point, {
              text: `${each * groups} 个贴纸平均分给 ${groups} 个小朋友，每人几个？`,
              answer: each,
              word: true,
              explanation: `平均分用除法。${each * groups} ÷ ${groups} = ${each}。`,
              steps: [`总数 ${each * groups}。`, `平均分成 ${groups} 份。`, `每份 ${each}。`]
            });
          }
        ],
        remainder: [
          () => {
            const divisor = rand(3, 9);
            const quotient = rand(5, 16 + level);
            const remainder = rand(1, divisor - 1);
            const total = divisor * quotient + remainder;
            return baseQuestion(point, {
              text: `${total} 个本子，每 ${divisor} 个装一包，可以装满几包，还剩几个？`,
              answer: quotient,
              answerLabel: `${quotient} 包，剩 ${remainder} 个`,
              word: true,
              explanation: `${total} ÷ ${divisor} = ${quotient} 余 ${remainder}，所以可以装满 ${quotient} 包，还剩 ${remainder} 个。`,
              steps: [`${divisor} × ${quotient} = ${divisor * quotient}。`, `${total} - ${divisor * quotient} = ${remainder}。`]
            });
          }
        ],
        mixed: [
          () => {
            const a = rand(18, 70 + level * 12);
            const b = rand(2, 9);
            const c = rand(3, 10);
            return baseQuestion(point, {
              text: `${a} + ${b} × ${c} = ?`,
              answer: a + b * c,
              explanation: `没有括号时先乘除后加减。先算 ${b} × ${c} = ${b * c}，再加 ${a}。`,
              steps: [`先算乘法 ${b} × ${c} = ${b * c}。`, `再算 ${a} + ${b * c} = ${a + b * c}。`]
            });
          },
          () => {
            const a = rand(6, 18);
            const b = rand(4, 16);
            const c = pick([2, 3, 4, 5]);
            return baseQuestion(point, {
              text: `(${a} + ${b}) × ${c} - ${a} = ?`,
              answer: (a + b) * c - a,
              explanation: `先算括号，再乘，最后减。`,
              steps: [`${a} + ${b} = ${a + b}。`, `${a + b} × ${c} = ${(a + b) * c}。`, `${(a + b) * c} - ${a} = ${(a + b) * c - a}。`]
            });
          }
        ],
        large: [
          () => {
            const a = rand(12000, 98000);
            const b = rand(3000, 26000);
            return baseQuestion(point, {
              text: `${a} 比 ${b} 多多少？`,
              answer: a - b,
              word: true,
              explanation: `求多多少，用较大的数减较小的数。${a} - ${b} = ${a - b}。`,
              steps: [`大数是 ${a}。`, `小数是 ${b}。`, `相差 ${a - b}。`]
            });
          }
        ],
        geometry: grade <= 2 ? [
          () => {
            const triangles = rand(2, 7);
            const circles = rand(2, 7);
            return baseQuestion(point, {
              text: `图形盒里有 ${triangles} 个三角形和 ${circles} 个圆形，一共有多少个图形？`,
              answer: triangles + circles,
              word: true,
              explanation: `数图形时把两类合起来，用加法。${triangles} + ${circles} = ${triangles + circles}。`,
              steps: [`三角形 ${triangles} 个。`, `圆形 ${circles} 个。`, `一共 ${triangles + circles} 个。`]
            });
          }
        ] : grade === 3 ? [
          () => {
            const side = rand(5, 18);
            return baseQuestion(point, {
              text: `正方形边长 ${side} cm，周长是多少 cm？`,
              answer: side * 4,
              word: true,
              explanation: `正方形周长 = 边长 × 4。${side} × 4 = ${side * 4}。`,
              steps: [`写公式：周长 = 边长 × 4。`, `代入 ${side} × 4。`]
            });
          }
        ] : grade === 4 ? [
          () => {
            const side = rand(4, 22);
            return baseQuestion(point, {
              text: `正方形边长 ${side} cm，面积是多少平方厘米？`,
              answer: side * side,
              word: true,
              explanation: `正方形面积 = 边长 × 边长。${side} × ${side} = ${side * side}。`,
              steps: [`写公式：面积 = 边长 × 边长。`, `代入 ${side} × ${side}。`]
            });
          }
        ] : grade === 5 ? [
          () => {
            const side = rand(3, 10);
            return baseQuestion(point, {
              text: `正方体棱长 ${side} cm，体积是多少立方厘米？`,
              answer: side * side * side,
              word: true,
              explanation: `正方体体积 = 棱长 × 棱长 × 棱长。${side} × ${side} × ${side} = ${side * side * side}。`,
              steps: [`写公式：V = a × a × a。`, `代入 ${side}。`]
            });
          }
        ] : [
          () => {
            const radius = rand(2, 8);
            return baseQuestion(point, {
              text: `圆的半径是 ${radius} cm，直径是多少 cm？`,
              answer: radius * 2,
              word: true,
              explanation: `直径是半径的 2 倍。${radius} × 2 = ${radius * 2}。`,
              steps: [`半径 ${radius} cm。`, `直径 = 半径 × 2。`]
            });
          }
        ],
        decimal: [
          () => {
            const a = round1(rand(24, 128) / 10);
            const b = round1(rand(8, 64) / 10);
            return baseQuestion(point, {
              text: `${a} - ${b} = ?`,
              answer: round1(a - b),
              explanation: `小数减法要把小数点对齐，再按位相减。`,
              steps: [`小数点对齐。`, `${a} - ${b} = ${formatAnswer(round1(a - b))}。`]
            });
          }
        ],
        fraction: [
          () => {
            const d = pick([6, 8, 10, 12]);
            const a = rand(1, d - 2);
            const b = rand(1, d - a - 1);
            const simplified = simplifyFraction(a + b, d);
            return baseQuestion(point, {
              text: `${a}/${d} + ${b}/${d} = ?`,
              answer: (a + b) / d,
              answerLabel: simplified.label,
              acceptedAnswers: simplified.accepted,
              explanation: `同分母分数相加，分母不变，分子相加。${a} + ${b} = ${a + b}，得 ${a + b}/${d}${simplified.label !== simplified.raw ? `，化简后是 ${simplified.label}` : ""}。`,
              steps: [`分母都是 ${d}。`, `分子相加得到 ${a + b}，结果 ${a + b}/${d}${simplified.label !== simplified.raw ? ` 约分成 ${simplified.label}` : ""}。`]
            });
          }
        ],
        unit: [
          () => {
            const kg = rand(2, 18);
            return baseQuestion(point, {
              text: `${kg} 千克 = ? 克`,
              answer: kg * 1000,
              explanation: `1 千克 = 1000 克，所以 ${kg} 千克 = ${kg * 1000} 克。`,
              steps: [`记住换算关系。`, `${kg} × 1000 = ${kg * 1000}。`]
            });
          }
        ],
        percent: [
          () => {
            const price = rand(6, 30) * 10;
            const discount = pick([
              { label: "七折", rate: 0.7 },
              { label: "七五折", rate: 0.75 },
              { label: "八折", rate: 0.8 },
              { label: "八五折", rate: 0.85 },
              { label: "九折", rate: 0.9 }
            ]);
            return baseQuestion(point, {
              text: `${price} 元的书打${discount.label}，现价多少元？`,
              answer: round1(price * discount.rate),
              word: true,
              explanation: `${discount.label}表示按原价的 ${Math.round(discount.rate * 100)}% 计算。${price} × ${discount.rate} = ${formatAnswer(round1(price * discount.rate))}。`,
              steps: [`把折扣转成比例。`, `原价 × 折扣比例。`]
            });
          }
        ],
        ratio: [
          () => {
            const a = rand(2, 5);
            const b = rand(3, 7);
            const each = rand(6, 18);
            return baseQuestion(point, {
              text: `红球和蓝球的数量比是 ${a}:${b}，一共有 ${(a + b) * each} 个球。蓝球有多少个？`,
              answer: b * each,
              word: true,
              explanation: `总份数是 ${a + b} 份，每份 ${(a + b) * each} ÷ ${a + b} = ${each} 个，蓝球有 ${b} 份。`,
              steps: [`总份数 ${a} + ${b} = ${a + b}。`, `每份 ${each} 个。`, `蓝球 ${b * each} 个。`]
            });
          }
        ],
        statistics: [
          () => {
            // 先定整数平均值，再造 4 个和为 4×均值的数据，保证能除尽
            const mean = rand(15, 36);
            const o1 = rand(-6, 6), o2 = rand(-6, 6), o3 = rand(-6, 6);
            const a = mean + o1, b = mean + o2, c = mean + o3, d = mean - o1 - o2 - o3;
            const total = a + b + c + d;
            return baseQuestion(point, {
              text: `四次跳绳分别是 ${a}、${b}、${c}、${d} 下，平均每次多少下？`,
              answer: mean,
              word: true,
              explanation: `平均数 = 总数 ÷ 份数。总数是 ${total}，${total} ÷ 4 = ${mean}。`,
              steps: [`总数是 ${a} + ${b} + ${c} + ${d} = ${total}。`, `${total} ÷ 4 = ${mean}。`]
            });
          }
        ],
        equation: [
          () => {
            const x = rand(3, 20 + level * 5);
            const times = rand(2, 8);
            return baseQuestion(point, {
              text: `${times}x = ${times * x}，x = ?`,
              answer: x,
              explanation: `等式两边同时除以 ${times}，得到 x = ${x}。`,
              steps: [`${times * x} ÷ ${times} = ${x}。`]
            });
          }
        ],
        word: [
          () => {
            if (grade === 1) return null;
            const per = rand(4, grade <= 2 ? 9 : 18);
            const days = rand(3, 8);
            const extra = rand(2, 12);
            return baseQuestion(point, {
              text: `白色金吉拉每天做 ${per} 道口算，连续做 ${days} 天后又多做 ${extra} 道,一共做了多少道？`,
              answer: per * days + extra,
              word: true,
              explanation: `先求连续 ${days} 天一共做多少，再加上多做的 ${extra} 道。`,
              steps: [`${per} × ${days} = ${per * days}。`, `${per * days} + ${extra} = ${per * days + extra}。`]
            });
          },
          () => {
            const total = rand(40, 140 + grade * 20);
            const used = rand(12, Math.floor(total / 2));
            const add = rand(8, 45);
            return baseQuestion(point, {
              text: `书架原有 ${total} 本书，借走 ${used} 本，又放回 ${add} 本。现在有多少本？`,
              answer: total - used + add,
              word: true,
              explanation: `先借走要减，再放回要加。${total} - ${used} + ${add} = ${total - used + add}。`,
              steps: [`借走后 ${total - used} 本。`, `放回后 ${total - used + add} 本。`]
            });
          }
        ],
        appendix: [
          () => {
            const start = rand(2, 12);
            const step = rand(2, 6);
            const gap = rand(1, 4);
            return baseQuestion(point, {
              text: `找规律：${start}，${start + step}，${start + step * 2 + gap}，${start + step * 3 + gap * 3}，下一个数是多少？`,
              answer: start + step * 4 + gap * 6,
              word: true,
              explanation: `相邻差依次是 ${step}、${step + gap}、${step + gap * 2}，下一次应增加 ${step + gap * 3}。`,
              steps: [`先看差的变化。`, `下一次差是 ${step + gap * 3}。`, `下一个数是 ${start + step * 4 + gap * 6}。`]
            });
          }
        ]
      };
      const list = templates[point.topic];
      return list ? pick(list)() : null;
    }
    function makeExtraQuestion(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const templates = {
        addsub: [
          () => {
            const base = grade <= 1 ? 20 : grade <= 2 ? 100 : grade <= 3 ? 1000 : grade <= 4 ? 10000 : 100000;
            const a = grade <= 1 ? rand(2, 8) : rand(Math.floor(base * 0.25), Math.max(Math.floor(base * 0.25) + 10, base - 160));
            const b = grade <= 1 ? rand(2, 8) : rand(18, Math.min(base - a - 12, 120 + level * 40));
            const c = grade <= 1 ? rand(1, Math.max(1, 20 - a - b)) : rand(6, 35);
            return baseQuestion(point, {
              text: `${a} + ${b} + ${c} = ?`,
              answer: a + b + c,
              explanation: `连加题可以先把前两个数相加，再加第三个数。${a} + ${b} + ${c} = ${a + b + c}。`,
              steps: [`先算 ${a} + ${b} = ${a + b}。`, `再加 ${c}，得到 ${a + b + c}。`]
            });
          },
          () => {
            const a = grade <= 1 ? rand(12, 20) : rand(60, 400 + level * 120);
            const b = rand(5, Math.floor(a / 2));
            const c = rand(3, Math.floor((a - b) / 2));
            return baseQuestion(point, {
              text: `${a} - ${b} - ${c} = ?`,
              answer: a - b - c,
              explanation: `连续减法按顺序计算，也可以先把要减的数合起来。${a} - (${b} + ${c}) = ${a - b - c}。`,
              steps: [`先算要减的总数：${b} + ${c} = ${b + c}。`, `再算 ${a} - ${b + c} = ${a - b - c}。`]
            });
          }
        ],
        compare: [
          () => {
            const a = rand(8, grade <= 1 ? 20 : 99);
            const diff = rand(2, grade <= 1 ? 9 : 28);
            return baseQuestion(point, {
              text: `${a + diff} 比 ${a} 多多少？`,
              answer: diff,
              explanation: `求多多少，用较大的数减较小的数。${a + diff} - ${a} = ${diff}。`,
              steps: [`大数是 ${a + diff}。`, `小数是 ${a}。`, `相差 ${diff}。`]
            });
          }
        ],
        muldiv: [
          () => {
            if (grade === 1) return null;
            const a = rand(2, grade <= 2 ? 9 : 24);
            const b = rand(3, 9 + level);
            const c = rand(2, 6);
            return baseQuestion(point, {
              text: `${a} × ${b} + ${c} = ?`,
              answer: a * b + c,
              explanation: `先算乘法，再算加法。${a} × ${b} = ${a * b}，再加 ${c}。`,
              steps: [`先算 ${a} × ${b} = ${a * b}。`, `再算 ${a * b} + ${c} = ${a * b + c}。`]
            });
          },
          () => {
            if (grade === 1) return null;
            const quotient = rand(4, 18);
            const divisor = rand(2, 9);
            const multiplier = rand(2, 5);
            return baseQuestion(point, {
              text: `${quotient * divisor} ÷ ${divisor} × ${multiplier} = ?`,
              answer: quotient * multiplier,
              explanation: `同级运算从左到右。先算 ${quotient * divisor} ÷ ${divisor} = ${quotient}，再乘 ${multiplier}。`,
              steps: [`先算除法得到 ${quotient}。`, `再算 ${quotient} × ${multiplier} = ${quotient * multiplier}。`]
            });
          }
        ],
        remainder: [
          () => {
            const divisor = rand(4, 9);
            const quotient = rand(7, 18);
            const remainder = rand(1, divisor - 1);
            const total = divisor * quotient + remainder;
            return baseQuestion(point, {
              text: `${total} ÷ ${divisor} = ?（填余数）`,
              answer: remainder,
              answerLabel: `${quotient} 余 ${remainder}`,
              explanation: `${divisor} × ${quotient} = ${divisor * quotient}，${total} - ${divisor * quotient} = ${remainder}。`,
              steps: [`找最接近的倍数 ${divisor * quotient}。`, `剩下 ${remainder}。`]
            });
          }
        ],
        mixed: [
          () => {
            const a = rand(12, 48);
            const b = rand(2, 8);
            const c = rand(3, 9);
            return baseQuestion(point, {
              text: `(${a} + ${b}) × ${c} = ?`,
              answer: (a + b) * c,
              explanation: `有括号先算括号。${a} + ${b} = ${a + b}，再乘 ${c}。`,
              steps: [`括号：${a} + ${b} = ${a + b}。`, `${a + b} × ${c} = ${(a + b) * c}。`]
            });
          }
        ],
        large: [
          () => {
            const a = rand(12000, 98000);
            const b = rand(2000, 18000);
            const c = rand(500, 3000);
            return baseQuestion(point, {
              text: `${a} + ${b} - ${c} = ?`,
              answer: a + b - c,
              explanation: `大数连加减要按位对齐，先算前两项，再减最后一项。${a} + ${b} - ${c} = ${a + b - c}。`,
              steps: [`先算 ${a} + ${b} = ${a + b}。`, `再算 ${a + b} - ${c} = ${a + b - c}。`]
            });
          }
        ],
        geometry: [
          () => {
            const w = rand(4, 18);
            const h = rand(3, 12);
            return baseQuestion(point, {
              text: `长方形长 ${w} cm，宽 ${h} cm，周长是多少 cm？`,
              answer: (w + h) * 2,
              word: true,
              explanation: `长方形周长 = (长 + 宽) × 2。(${w} + ${h}) × 2 = ${(w + h) * 2}。`,
              steps: [`先算一组长宽和：${w} + ${h} = ${w + h}。`, `再乘 2 得到周长。`]
            });
          },
          () => {
            const side = rand(3, 16);
            return baseQuestion(point, {
              text: `正方形边长 ${side} cm，周长是多少 cm？`,
              answer: side * 4,
              word: true,
              explanation: `正方形四条边一样长，周长 = 边长 × 4。`,
              steps: [`${side} × 4 = ${side * 4}。`]
            });
          }
        ],
        decimal: [
          () => {
            const a = round1(rand(25, 96) / 10);
            const b = round1(rand(12, 68) / 10);
            const c = round1(rand(5, 35) / 10);
            return baseQuestion(point, {
              text: `${a} + ${b} - ${c} = ?`,
              answer: round1(a + b - c),
              explanation: "小数加减混合仍然要小数点对齐，再按从左到右计算。",
              steps: [`先算 ${a} + ${b} = ${formatAnswer(round1(a + b))}。`, `再减 ${c} 得 ${formatAnswer(round1(a + b - c))}。`]
            });
          }
        ],
        fraction: [
          () => {
            const d = pick([5, 6, 8, 10, 12]);
            const a = rand(2, d - 1);
            const b = rand(1, a - 1);
            const simplified = simplifyFraction(a - b, d);
            return baseQuestion(point, {
              text: `${a}/${d} - ${b}/${d} = ?${simplified.terminating ? "（可填分数或小数）" : "（用最简分数表示）"}`,
              answer: (a - b) / d,
              answerLabel: simplified.label,
              acceptedAnswers: simplified.accepted,
              explanation: `同分母分数相减，分母不变，分子相减。${a} - ${b} = ${a - b}，得 ${a - b}/${d}${simplified.label !== simplified.raw ? `，化简后是 ${simplified.label}` : ""}。`,
              steps: [`分母都是 ${d}。`, `分子相减：${a} - ${b} = ${a - b}，结果 ${a - b}/${d}${simplified.label !== simplified.raw ? ` 约分成 ${simplified.label}` : ""}。`]
            });
          }
        ],
        unit: [
          () => {
            const meters = rand(2, 18);
            const cm = rand(5, 95);
            return baseQuestion(point, {
              text: `${meters} 米 ${cm} 厘米 = ? 厘米`,
              answer: meters * 100 + cm,
              explanation: `1 米 = 100 厘米。${meters} 米是 ${meters * 100} 厘米，再加 ${cm} 厘米。`,
              steps: [`${meters} 米 = ${meters * 100} 厘米。`, `合计 ${meters * 100 + cm} 厘米。`]
            });
          }
        ],
        percent: [
          () => {
            const price = rand(8, 36) * 10;
            const rate = pick([15, 20, 25, 30, 40]);
            return baseQuestion(point, {
              text: `${price} 元的商品降价 ${rate}%，降价多少元？`,
              answer: round1(price * rate / 100),
              explanation: `降价金额 = 原价 × 降价百分比。${price} × ${rate}% = ${formatAnswer(round1(price * rate / 100))}。`,
              steps: [`把 ${rate}% 看成 ${rate}/100。`, `用 ${price} × ${rate}% = ${formatAnswer(round1(price * rate / 100))}。`]
            });
          }
        ],
        ratio: [
          () => {
            const a = rand(2, 6);
            const b = a + rand(1, 5);
            const each = rand(8, 24);
            return baseQuestion(point, {
              text: `甲乙数量比是 ${a}:${b}，甲有 ${a * each} 个，乙有多少个？`,
              answer: b * each,
              explanation: `甲的 ${a} 份是 ${a * each} 个，所以每份是 ${each} 个，乙有 ${b} 份。`,
              steps: [`每份：${a * each} ÷ ${a} = ${each}。`, `乙：${each} × ${b} = ${b * each}。`]
            });
          }
        ],
        statistics: [
          () => {
            // 先定整数平均值，再造 3 个和为 3×均值的数据，保证能除尽
            const mean = rand(20, 38);
            const o1 = rand(-8, 8), o2 = rand(-8, 8);
            const a = mean + o1, b = mean + o2, c = mean - o1 - o2;
            const total = a + b + c;
            return baseQuestion(point, {
              text: `三天分别读书 ${a}、${b}、${c} 页，平均每天读多少页？`,
              answer: mean,
              word: true,
              explanation: `平均数 = 总数 ÷ 份数。(${a} + ${b} + ${c}) ÷ 3 = ${total} ÷ 3 = ${mean}。`,
              steps: [`总页数：${a} + ${b} + ${c} = ${total} 页。`, `平均：${total} ÷ 3 = ${mean} 页。`]
            });
          }
        ],
        equation: [
          () => {
            const x = rand(4, 24 + level * 6);
            const left = rand(8, 32);
            return baseQuestion(point, {
              text: `${left} + x = ${left + x}，x = ?`,
              answer: x,
              explanation: `等式两边同时减去 ${left}，得到 x = ${x}。`,
              steps: [`${left + x} - ${left} = ${x}。`]
            });
          }
        ],
        word: [
          () => {
            const a = rand(12, grade <= 2 ? 60 : 180);
            const b = rand(6, Math.floor(a / 2));
            const c = rand(4, 30);
            return baseQuestion(point, {
              text: `白色金吉拉有 ${a} 颗小鱼饼，送给朋友 ${b} 颗，又得到 ${c} 颗。现在有多少颗？`,
              answer: a - b + c,
              word: true,
              explanation: `先送出要减，再得到要加。${a} - ${b} + ${c} = ${a - b + c}。`,
              steps: [`送出后：${a} - ${b} = ${a - b}。`, `又得到：${a - b} + ${c} = ${a - b + c}。`]
            });
          }
        ],
        appendix: [
          () => {
            const start = rand(3, 15);
            const step = rand(3, 8);
            return baseQuestion(point, {
              text: `找规律：${start}，${start + step}，${start + step * 2}，${start + step * 3}，下一个数是多少？`,
              answer: start + step * 4,
              word: true,
              explanation: `每次增加 ${step}，所以再加一次 ${step}。`,
              steps: [`相邻两个数都相差 ${step}。`, `下一个是 ${start + step * 3} + ${step} = ${start + step * 4}。`]
            });
          }
        ]
      };
      const list = templates[point.topic];
      return list ? pick(list)() : null;
    }
    function makeAddSub(point, level) {
      const maxByGrade = [20, 100, 1000, 10000, 100000, 1000000];
      if (point.id === "g1-10-add") {
        const variant = rand(1, 3);
        if (variant === 1) {
          const answer = rand(2, 10);
          const a = rand(1, answer - 1);
          const b = answer - a;
          return baseQuestion(point, {
            text: `${a} + ${b} = ?`,
            answer,
            explanation: `这是 10 以内加法。可以从 ${a} 开始往后数 ${b} 个数，也可以把两个数合起来，最后得到 ${answer}。`,
            steps: [`先确认结果不能超过 10。`, `从 ${a} 往后数 ${b} 个。`, `得到 ${a} + ${b} = ${answer}。`]
          });
        }
        if (variant === 2) {
          const target = rand(4, 10);
          const known = rand(1, target - 1);
          const answer = target - known;
          return baseQuestion(point, {
            text: `${known} 加上多少等于 ${target}？`,
            answer,
            word: true,
            explanation: `这是 10 以内补数题。想从 ${known} 数到 ${target} 还差几个，也可以用 ${target} - ${known}。`,
            steps: [`目标数是 ${target}。`, `已经有 ${known}。`, `${target} - ${known} = ${answer}，所以还差 ${answer}。`],
            templateType: "补数关系"
          });
        }
        const a = rand(2, 10);
        const b = rand(1, a - 1);
        const answer = a - b;
        return baseQuestion(point, {
          text: `${a} - ${b} = ?`,
          answer,
          explanation: `这是 10 以内减法。可以从 ${a} 里面拿走 ${b} 个，数一数还剩多少，最后得到 ${answer}。`,
          steps: [`先从 ${a} 开始。`, `拿走 ${b} 个。`, `剩下 ${a} - ${b} = ${answer}。`]
        });
      }
      if (point.id === "g2-100-add") {
        const makeCarryAdd = () => {
          const onesA = rand(4, 9);
          const onesB = rand(10 - onesA, 9);
          const tensA = rand(1, 7);
          const maxTensB = Math.max(1, 8 - tensA);
          const tensB = rand(1, maxTensB);
          const a = tensA * 10 + onesA;
          const b = tensB * 10 + onesB;
          const answer = a + b;
          return baseQuestion(point, {
            text: `${a} + ${b} = ?`,
            answer,
            explanation: `这是一道 100 以内进位加法。个位 ${onesA} + ${onesB} 满 10，要向十位进 1，最后得到 ${answer}。`,
            steps: [`先算个位：${onesA} + ${onesB} = ${onesA + onesB}，满 10 进 1。`, `再算十位，记得加上进来的 1。`, `${a} + ${b} = ${answer}。`]
          });
        };
        const makeBorrowSub = () => {
          const onesA = rand(0, 7);
          const onesB = rand(onesA + 1, 9);
          const tensA = rand(3, 9);
          const tensB = rand(1, tensA - 1);
          const a = tensA * 10 + onesA;
          const b = tensB * 10 + onesB;
          const answer = a - b;
          return baseQuestion(point, {
            text: `${a} - ${b} = ?`,
            answer,
            explanation: `这是一道 100 以内退位减法。个位 ${onesA} 不够减 ${onesB}，要从十位退 1 当 10，最后得到 ${answer}。`,
            steps: [`个位不够减：${onesA} < ${onesB}。`, `从十位退 1，个位变成 ${onesA + 10}。`, `${a} - ${b} = ${answer}。`]
          });
        };
        return Math.random() > 0.5 ? makeCarryAdd() : makeBorrowSub();
      }
      const pointGrade = clamp(Number(point.grade) || state.grade, 1, 6);
      const cap = maxByGrade[pointGrade - 1];
      const max = Math.min(cap, Math.round(20 * Math.pow(4.2, pointGrade - 1) * (0.75 + level * 0.18)));
      const op = Math.random() > 0.48 ? "+" : "-";
      const answer = op === "+" ? rand(3, max) : null;
      let a = op === "+" ? rand(2, answer - 1) : rand(2, max);
      let b = op === "+" ? answer - a : rand(1, Math.min(a - 1, Math.max(8, Math.floor(max * (0.35 + level * 0.08)))));
      const finalAnswer = op === "+" ? answer : a - b;
      return baseQuestion(point, {
        text: `${a} ${op} ${b} = ?`,
        answer: finalAnswer,
        explanation: op === "+"
          ? `这是加法，就是把 ${a} 和 ${b} 合在一起。可以先算整十、整百部分，再算剩下的部分，最后得到 ${finalAnswer}。`
          : `这是减法，就是从 ${a} 里面拿走 ${b}。如果不能一下算出，可以把 ${b} 拆成好减的几部分，分步减，最后得到 ${finalAnswer}。`,
        steps: op === "+" ? [`先看运算符号：这是加法。`, `把 ${a} 和 ${b} 合起来。`, `算出 ${a} + ${b} = ${finalAnswer}。`] : [`先看运算符号：这是减法。`, `从 ${a} 里减去 ${b}。`, `算出 ${a} - ${b} = ${finalAnswer}。`]
      });
    }
    function makeCompare(point, level) {
      const a = rand(6, 24 + level * 10);
      const diff = rand(2, 8 + level * 4);
      const b = a + diff;
      const variants = [
        () => baseQuestion(point, {
          text: `${b} 比 ${a} 多多少？`,
          answer: diff,
          word: true,
          explanation: `问"多多少"就是求两个数的差。用较大的 ${b} 减去较小的 ${a}，得到 ${diff}。`,
          steps: [`找到两个数：${b} 和 ${a}。`, `比较多少用减法。`, `${b} - ${a} = ${diff}。`]
        }),
        () => baseQuestion(point, {
          text: `${a} 比 ${b} 少多少？`,
          answer: diff,
          word: true,
          explanation: `问"少多少"也是比较两个数的差。用大数 ${b} 减小数 ${a}，得到 ${diff}。`,
          steps: [`大数是 ${b}。`, `小数是 ${a}。`, `${b} - ${a} = ${diff}。`]
        }),
        () => {
          const target = rand(10, 20 + level * 8);
          const part = rand(2, target - 2);
          return baseQuestion(point, {
            text: `${part} 加上多少等于 ${target}？`,
            answer: target - part,
            word: true,
            explanation: `这是补数题。想从 ${part} 到 ${target} 还差多少，用 ${target} - ${part}。`,
            steps: [`目标是 ${target}。`, `已经有 ${part}。`, `${target} - ${part} = ${target - part}。`]
          });
        },
        () => {
          const nums = [rand(3, 18), rand(5, 24), rand(8, 28)].sort((x, y) => x - y);
          return baseQuestion(point, {
            text: `${nums.join("、")} 这三个数中，最大的数是多少？`,
            answer: nums[2],
            word: true,
            explanation: `比大小时从十位再到个位看。${nums.join("、")} 中最大的数是 ${nums[2]}。`,
            steps: [`按从小到大排：${nums.join(" < ")}。`, `排在最后的是最大数。`, `最大数是 ${nums[2]}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeMulDiv(point, level) {
      const pointGrade = clamp(Number(point.grade) || state.grade, 1, 6);
      const forceDivision = point.id === "g2-table-div";
      const tableOnly = point.id === "g2-table" || forceDivision;
      if (forceDivision) {
        const divisor = rand(2, 9);
        const quotient = rand(2, 9);
        const total = divisor * quotient;
        const variants = [
          () => baseQuestion(point, {
            text: `${total} ÷ ${divisor} = ?`,
            answer: quotient,
            explanation: `这是表内除法，可以用乘法口诀反过来想。因为 ${divisor} × ${quotient} = ${total}，所以 ${total} ÷ ${divisor} = ${quotient}。`,
            steps: [`先看除数是 ${divisor}。`, `想口诀：${divisor} × ${quotient} = ${total}。`, `所以商是 ${quotient}。`]
          }),
          () => baseQuestion(point, {
            text: `${total} 个圆片，每 ${divisor} 个分一组，可以分成几组？`,
            answer: quotient,
            word: true,
            explanation: `每 ${divisor} 个一组，求能分几组，用除法。${total} ÷ ${divisor} = ${quotient}。`,
            steps: [`总数是 ${total}。`, `每组 ${divisor} 个。`, `${total} ÷ ${divisor} = ${quotient} 组。`]
          }),
          () => baseQuestion(point, {
            text: `${total} 支铅笔平均分给 ${quotient} 个小朋友，每人几支？`,
            answer: divisor,
            word: true,
            explanation: `平均分给 ${quotient} 人，每人一样多，用除法。${total} ÷ ${quotient} = ${divisor}。`,
            steps: [`总共有 ${total} 支。`, `平均分给 ${quotient} 人。`, `${total} ÷ ${quotient} = ${divisor} 支。`]
          })
        ];
        return pick(variants)();
      }
      if (tableOnly || Math.random() > 0.45 || pointGrade <= 2) {
        const a = rand(2, tableOnly ? 9 : Math.min(12 + level * 4, pointGrade >= 5 ? 36 : 18));
        const b = rand(2, tableOnly ? 9 : Math.min(9 + level * 2, pointGrade >= 4 ? 20 : 12));
        const variants = [
          () => baseQuestion(point, {
            text: `${a} × ${b} = ?`,
            answer: a * b,
            explanation: `乘法可以看成"${b} 组，每组 ${a} 个"。想乘法口诀或分组相加，${a} × ${b} = ${a * b}。`,
            steps: [`把乘法看成 ${b} 组。`, `每组有 ${a} 个。`, `一共是 ${a} × ${b} = ${a * b}。`]
          }),
          () => baseQuestion(point, {
            text: `${b} 个盘子，每盘放 ${a} 个草莓，一共有多少个草莓？`,
            answer: a * b,
            word: true,
            explanation: `每盘数量相同，求总数用乘法。${a} × ${b} = ${a * b}。`,
            steps: [`每盘 ${a} 个。`, `有 ${b} 个盘子。`, `${a} × ${b} = ${a * b} 个。`]
          }),
          () => baseQuestion(point, {
            text: `${a} + ${a} + ${a} + ${a} = ?`,
            answer: a * 4,
            explanation: `几个相同的数相加，可以改成乘法。这里是 4 个 ${a} 相加，等于 ${a} × 4。`,
            steps: [`看见 4 个 ${a}。`, `改写成 ${a} × 4。`, `${a} × 4 = ${a * 4}。`]
          })
        ];
        return pick(variants)();
      }
      const divisor = rand(2, Math.min(12 + level * 3, pointGrade >= 4 ? 30 : 12));
      const quotient = rand(3, Math.min(16 + level * 7, pointGrade >= 4 ? 70 : 18));
      return baseQuestion(point, {
        text: `${divisor * quotient} ÷ ${divisor} = ?`,
        answer: quotient,
        explanation: `除法表示平均分。想"${divisor} 乘几等于 ${divisor * quotient}"，所以答案是 ${quotient}。`,
        steps: [`把 ${divisor * quotient} 平均分成 ${divisor} 份。`, `想乘法：${divisor} × ${quotient} = ${divisor * quotient}。`, `所以商是 ${quotient}。`]
      });
    }
    function makeRemainder(point, level) {
      const divisor = rand(3, 9 + level);
      const quotient = rand(4, 12 + level * 3);
      const remainder = rand(1, divisor - 1);
      const total = divisor * quotient + remainder;
      const variants = [
        () => baseQuestion(point, {
          text: `${total} ÷ ${divisor} = ?（填写商，小数不用填）`,
          answer: quotient,
          answerLabel: `${quotient} 余 ${remainder}`,
          explanation: `有余数除法先找最接近 ${total} 但不超过它的 ${divisor} 的倍数。${divisor} × ${quotient} = ${divisor * quotient}，还剩 ${remainder}，所以是 ${quotient} 余 ${remainder}。`,
          steps: [`找 ${divisor} 的倍数。`, `${divisor} × ${quotient} = ${divisor * quotient}，再大就超过 ${total}。`, `${total} - ${divisor * quotient} = ${remainder}，所以商 ${quotient} 余 ${remainder}。`]
        }),
        () => baseQuestion(point, {
          text: `${total} 个扣子，每 ${divisor} 个装一袋，最多能装满几袋？`,
          answer: quotient,
          answerLabel: `${quotient} 袋，余 ${remainder} 个`,
          word: true,
          explanation: `每 ${divisor} 个装一袋，先看能装满几袋。${divisor} × ${quotient} = ${divisor * quotient}，还剩 ${remainder} 个。`,
          steps: [`找不超过 ${total} 的 ${divisor} 的倍数。`, `${divisor} × ${quotient} = ${divisor * quotient}。`, `剩下 ${total} - ${divisor * quotient} = ${remainder} 个。`]
        }),
        () => baseQuestion(point, {
          text: `${total} 名同学坐车，每辆车坐 ${divisor} 人，至少需要几辆车？`,
          answer: quotient + 1,
          answerLabel: `${quotient + 1} 辆`,
          word: true,
          explanation: `坐车问题有余数时，剩下的人也需要一辆车。${total} ÷ ${divisor} = ${quotient} 余 ${remainder}，所以至少 ${quotient + 1} 辆。`,
          steps: [`先除：${total} ÷ ${divisor} = ${quotient} 余 ${remainder}。`, `有余下的 ${remainder} 人。`, `所以车数要加 1，是 ${quotient + 1} 辆。`]
        })
      ];
      return pick(variants)();
    }
    function makeMixed(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const variants = [
        () => {
          const a = rand(3, 12 + level * 3);
          const b = rand(2, 10 + level * 2);
          const c = rand(8, 60 + level * 12);
          const answer = a * b + c;
          return baseQuestion(point, {
            text: `${a} × ${b} + ${c} = ?`,
            answer,
            explanation: `混合运算要先算乘除，再算加减。先算 ${a} × ${b} = ${a * b}，再算 ${a * b} + ${c} = ${answer}。`,
            steps: [`先算乘法：${a} × ${b} = ${a * b}。`, `再算加法：${a * b} + ${c} = ${answer}。`]
          });
        },
        () => {
          const c = pick([2, 3, 4, 5, 6, 8, 10]);
          const answer = rand(8, 38 + level * 8);
          const sum = answer * c;
          const a = rand(12, sum - 8);
          const b = sum - a;
          return baseQuestion(point, {
            text: `(${a} + ${b}) ÷ ${c} = ?`,
            answer,
            explanation: `有括号时先算括号。先算 ${a} + ${b} = ${sum}，再算 ${sum} ÷ ${c} = ${answer}。`,
            steps: [`先算括号：${a} + ${b} = ${sum}。`, `再算除法：${sum} ÷ ${c} = ${answer}。`]
          });
        },
        () => {
          const a = rand(70, 220);
          const b = rand(3, 9 + level);
          const c = rand(4, 18 + level * 3);
          const answer = a - b * c;
          return baseQuestion(point, {
            text: `${a} - ${b} × ${c} = ?`,
            answer,
            explanation: `先乘除后加减。先算 ${b} × ${c} = ${b * c}，再算 ${a} - ${b * c} = ${answer}。`,
            steps: [`先算乘法：${b} × ${c} = ${b * c}。`, `再算减法：${a} - ${b * c} = ${answer}。`]
          });
        },
        () => {
          const divisor = rand(3, 9);
          const quotient = rand(8, 28 + level * 6);
          const add = rand(12, 68);
          const dividend = divisor * quotient;
          const answer = quotient + add;
          return baseQuestion(point, {
            text: `${dividend} ÷ ${divisor} + ${add} = ?`,
            answer,
            explanation: `先算除法，再算加法。${dividend} ÷ ${divisor} = ${quotient}，${quotient} + ${add} = ${answer}。`,
            steps: [`先算除法：${dividend} ÷ ${divisor} = ${quotient}。`, `再算加法：${quotient} + ${add} = ${answer}。`]
          });
        },
        () => {
          const a = rand(grade <= 3 ? 8 : 18, grade <= 3 ? 40 : 120 + level * 16);
          const b = rand(grade <= 3 ? 4 : 12, grade <= 3 ? 30 : 80 + level * 10);
          const c = rand(2, grade <= 3 ? 6 : 12);
          const d = rand(3, Math.max(4, Math.floor((a + b) * c * 0.35)));
          const answer = (a + b) * c - d;
          return baseQuestion(point, {
            text: `(${a} + ${b}) × ${c} - ${d} = ?`,
            answer,
            explanation: `有括号先算括号，再算乘法，最后算减法。先算 ${a} + ${b} = ${a + b}，再乘 ${c}，最后减 ${d}。`,
            steps: [`先算括号：${a} + ${b} = ${a + b}。`, `再算乘法：${a + b} × ${c} = ${(a + b) * c}。`, `最后减：${(a + b) * c} - ${d} = ${answer}。`],
            templateType: "括号混合"
          });
        },
        () => {
          const divisor = pick([2, 3, 4, 5, 6, 8]);
          const answer = rand(grade <= 3 ? 6 : 12, grade <= 3 ? 28 : 90 + level * 8);
          const multiplier = rand(2, grade <= 3 ? 6 : 12);
          const sum = answer * divisor;
          const a = rand(3, Math.max(4, Math.floor(sum / multiplier) - 1));
          const b = Math.max(2, Math.floor(sum / multiplier) - a);
          const targetSum = a + b;
          const product = targetSum * multiplier;
          return baseQuestion(point, {
            text: `(${a} + ${b}) × ${multiplier} ÷ ${divisor} = ?`,
            answer: round1(product / divisor),
            explanation: `先算括号，再按从左到右算乘除。${a} + ${b} = ${targetSum}，${targetSum} × ${multiplier} = ${product}，再除以 ${divisor}。`,
            steps: [`括号：${a} + ${b} = ${targetSum}。`, `乘法：${targetSum} × ${multiplier} = ${product}。`, `除法：${product} ÷ ${divisor} = ${formatAnswer(round1(product / divisor))}。`],
            templateType: "括号乘除"
          });
        }
      ];
      return pick(variants)();
    }
    function makeTwoStep(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const integerAddSub = (max) => {
        const variant = rand(1, 4);
        if (variant === 1) {
          const a = rand(2, Math.max(3, Math.floor(max * 0.45)));
          const b = rand(2, Math.max(3, Math.floor(max * 0.35)));
          const c = rand(1, Math.max(2, max - a - b));
          return baseQuestion(point, {
            text: `${a} + ${b} + ${c} = ?`,
            answer: a + b + c,
            explanation: `两步连加先算前两个数，再加第三个数。${a} + ${b} = ${a + b}，${a + b} + ${c} = ${a + b + c}。`,
            steps: [`第一步：${a} + ${b} = ${a + b}。`, `第二步：${a + b} + ${c} = ${a + b + c}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 2) {
          const a = rand(Math.max(8, Math.floor(max * 0.55)), max);
          const b = rand(2, Math.max(3, Math.floor(a * 0.35)));
          const c = rand(1, Math.max(2, Math.floor((a - b) * 0.45)));
          return baseQuestion(point, {
            text: `${a} - ${b} - ${c} = ?`,
            answer: a - b - c,
            explanation: `两步连减按顺序算，也可以先合并要减的数。`,
            steps: [`第一步：${a} - ${b} = ${a - b}。`, `第二步：${a - b} - ${c} = ${a - b - c}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 3) {
          const a = rand(4, Math.max(6, Math.floor(max * 0.4)));
          const b = rand(3, Math.max(5, Math.floor(max * 0.45)));
          const c = rand(2, Math.max(3, Math.floor((a + b) * 0.55)));
          return baseQuestion(point, {
            text: `${a} + ${b} - ${c} = ?`,
            answer: a + b - c,
            explanation: `加减混合从左到右算，先把两部分合起来，再拿走一部分。`,
            steps: [`第一步：${a} + ${b} = ${a + b}。`, `第二步：${a + b} - ${c} = ${a + b - c}。`],
            templateType: "两步计算"
          });
        }
        const a = rand(Math.max(10, Math.floor(max * 0.45)), max);
        const b = rand(2, Math.max(3, Math.floor(a * 0.35)));
        const c = rand(2, Math.max(3, max - (a - b)));
        return baseQuestion(point, {
          text: `${a} - ${b} + ${c} = ?`,
          answer: a - b + c,
          explanation: `加减混合从左到右算，先减再加。`,
          steps: [`第一步：${a} - ${b} = ${a - b}。`, `第二步：${a - b} + ${c} = ${a - b + c}。`],
          templateType: "两步计算"
        });
      };
      const mulDivAddSub = () => {
        const a = rand(2, grade <= 3 ? 9 : 24 + level * 4);
        const b = rand(2, grade <= 3 ? 9 : 18 + level * 3);
        const c = rand(4, grade <= 3 ? 35 : 120 + level * 30);
        const variant = rand(1, 4);
        if (variant === 1) {
          return baseQuestion(point, {
            text: `${a} × ${b} + ${c} = ?`,
            answer: a * b + c,
            explanation: `先算乘法，再算加法。${a} × ${b} = ${a * b}，再加 ${c}。`,
            steps: [`第一步：${a} × ${b} = ${a * b}。`, `第二步：${a * b} + ${c} = ${a * b + c}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 2) {
          const quotient = rand(4, grade <= 3 ? 18 : 60 + level * 8);
          const divisor = rand(2, grade <= 3 ? 9 : 16);
          const add = rand(5, grade <= 3 ? 40 : 120);
          const dividend = quotient * divisor;
          return baseQuestion(point, {
            text: `${dividend} ÷ ${divisor} + ${add} = ?`,
            answer: quotient + add,
            explanation: `先算除法，再算加法。${dividend} ÷ ${divisor} = ${quotient}，再加 ${add}。`,
            steps: [`第一步：${dividend} ÷ ${divisor} = ${quotient}。`, `第二步：${quotient} + ${add} = ${quotient + add}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 3) {
          const left = rand(grade <= 3 ? 6 : 20, grade <= 3 ? 40 : 180);
          const right = rand(grade <= 3 ? 4 : 12, grade <= 3 ? 35 : 120);
          const multiplier = rand(2, grade <= 3 ? 6 : 12);
          return baseQuestion(point, {
            text: `(${left} + ${right}) × ${multiplier} = ?`,
            answer: (left + right) * multiplier,
            explanation: `有括号时先算括号，再算乘法。先合起来，再看有几组。`,
            steps: [`第一步：${left} + ${right} = ${left + right}。`, `第二步：${left + right} × ${multiplier} = ${(left + right) * multiplier}。`],
            templateType: "两步计算"
          });
        }
        const lower = Math.max(60, a * b + 10);
        const upper = Math.max(lower + 40, grade <= 3 ? 180 : 520 + level * 80);
        const base = rand(lower, upper);
        return baseQuestion(point, {
          text: `${base} - ${a} × ${b} = ?`,
          answer: base - a * b,
          explanation: `先算乘法，再算减法。${a} × ${b} = ${a * b}，再用 ${base} 减去中间结果。`,
          steps: [`第一步：${a} × ${b} = ${a * b}。`, `第二步：${base} - ${a * b} = ${base - a * b}。`],
          templateType: "两步计算"
        });
      };
      const twoStepMulDiv = () => {
        const tableMax = grade <= 1 ? 5 : 9;
        const variant = rand(1, 5);
        if (variant === 1) {
          const a = rand(2, tableMax);
          const b = rand(2, grade <= 1 ? 4 : tableMax);
          const c = rand(2, grade <= 1 ? 3 : 6);
          return baseQuestion(point, {
            text: `${a} × ${b} × ${c} = ?`,
            answer: a * b * c,
            explanation: `两步乘法按顺序算。先算 ${a} × ${b} = ${a * b}，再算 ${a * b} × ${c} = ${a * b * c}。`,
            steps: [`第一步：${a} × ${b} = ${a * b}。`, `第二步：${a * b} × ${c} = ${a * b * c}。`],
            templateType: "两步乘除法"
          });
        }
        if (variant === 2) {
          const divisor = rand(2, tableMax);
          const quotient = rand(2, grade <= 1 ? 6 : tableMax);
          const multiplier = rand(2, grade <= 1 ? 4 : tableMax);
          const dividend = divisor * quotient;
          return baseQuestion(point, {
            text: `${dividend} ÷ ${divisor} × ${multiplier} = ?`,
            answer: quotient * multiplier,
            explanation: `乘除同级，从左到右算。先算 ${dividend} ÷ ${divisor} = ${quotient}，再算 ${quotient} × ${multiplier} = ${quotient * multiplier}。`,
            steps: [`第一步：${dividend} ÷ ${divisor} = ${quotient}。`, `第二步：${quotient} × ${multiplier} = ${quotient * multiplier}。`],
            templateType: "两步乘除法"
          });
        }
        if (variant === 3) {
          const a = rand(2, tableMax);
          const b = rand(2, grade <= 1 ? 4 : tableMax);
          const product = a * b;
          const divisor = pick(Array.from({ length: tableMax - 1 }, (_, index) => index + 2).filter((n) => product % n === 0));
          return baseQuestion(point, {
            text: `${a} × ${b} ÷ ${divisor} = ?`,
            answer: product / divisor,
            explanation: `先乘再除。先算 ${a} × ${b} = ${product}，再算 ${product} ÷ ${divisor} = ${product / divisor}。`,
            steps: [`第一步：${a} × ${b} = ${product}。`, `第二步：${product} ÷ ${divisor} = ${product / divisor}。`],
            templateType: "两步乘除法"
          });
        }
        if (variant === 4) {
          const firstDivisor = rand(2, tableMax);
          const secondDivisor = rand(2, grade <= 1 ? 4 : tableMax);
          const answer = rand(2, grade <= 1 ? 5 : tableMax);
          const total = answer * firstDivisor * secondDivisor;
          return baseQuestion(point, {
            text: `${total} ÷ ${firstDivisor} ÷ ${secondDivisor} = ?`,
            answer,
            explanation: `连续除法从左到右算。先平均分一次，再把结果继续平均分。`,
            steps: [`第一步：${total} ÷ ${firstDivisor} = ${total / firstDivisor}。`, `第二步：${total / firstDivisor} ÷ ${secondDivisor} = ${answer}。`],
            templateType: "两步乘除法"
          });
        }
        const groups = rand(2, grade <= 1 ? 4 : 8);
        const each = rand(2, grade <= 1 ? 5 : 9);
        const total = groups * each;
        const share = pick(Array.from({ length: tableMax - 1 }, (_, index) => index + 2).filter((n) => total % n === 0));
        return baseQuestion(point, {
          text: `${groups} 组小棒，每组 ${each} 根，一共再平均分给 ${share} 人，每人几根？（${groups} × ${each} ÷ ${share}）`,
          answer: total / share,
          word: true,
          explanation: `先求一共有多少根，再平均分。${groups} × ${each} = ${total}，${total} ÷ ${share} = ${total / share}。`,
          steps: [`第一步：${groups} × ${each} = ${total} 根。`, `第二步：${total} ÷ ${share} = ${total / share} 根。`],
          templateType: "两步乘除法"
        });
      };
      const decimalFractionPercent = () => {
        const variant = rand(1, 3);
        if (variant === 1) {
          const a = round1(rand(24, 120 + level * 10) / 10);
          const b = round1(rand(8, 72) / 10);
          const c = round1(rand(5, 45) / 10);
          return baseQuestion(point, {
            text: `${a} + ${b} - ${c} = ?`,
            answer: round1(a + b - c),
            explanation: `小数两步加减仍然要小数点对齐，再从左到右计算。`,
            steps: [`第一步：${a} + ${b} = ${formatAnswer(round1(a + b))}。`, `第二步：${formatAnswer(round1(a + b))} - ${c} = ${formatAnswer(round1(a + b - c))}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 2) {
          const d = pick([6, 8, 10, 12]);
          const a = rand(1, Math.floor(d / 2));
          const b = rand(1, d - a - 1);
          const c = rand(1, Math.max(1, a + b - 1));
          const simplified = simplifyFraction(a + b - c, d);
          const raw = simplified.raw;
          return baseQuestion(point, {
            text: `${a}/${d} + ${b}/${d} - ${c}/${d} = ?${simplified.terminating ? "（可填分数或小数）" : "（用最简分数表示）"}`,
            answer: (a + b - c) / d,
            answerLabel: simplified.label,
            acceptedAnswers: simplified.accepted,
            explanation: `同分母分数两步加减，分母不变，分子按顺序加减，得 ${raw}${simplified.label !== raw ? `，化简后是 ${simplified.label}` : ""}。`,
            steps: [`第一步：${a}/${d} + ${b}/${d} = ${a + b}/${d}。`, `第二步：${a + b}/${d} - ${c}/${d} = ${raw}${simplified.label !== raw ? ` 约分成 ${simplified.label}` : ""}。`],
            templateType: "两步计算"
          });
        }
        const total = rand(12, 60) * 10;
        const rate = pick([10, 15, 20, 25, 30, 40]);
        const extra = rand(8, 60);
        return baseQuestion(point, {
          text: `${total} 的 ${rate}% 再加 ${extra} 是多少？`,
          answer: round1(total * rate / 100 + extra),
          explanation: `先求 ${total} 的 ${rate}%，再加 ${extra}。`,
          steps: [`第一步：${total} × ${rate}% = ${formatAnswer(round1(total * rate / 100))}。`, `第二步：${formatAnswer(round1(total * rate / 100))} + ${extra} = ${formatAnswer(round1(total * rate / 100 + extra))}。`],
          templateType: "两步计算"
        });
      };
      if (point.id === "g2-two-step-muldiv") return twoStepMulDiv();
      if (grade === 1) return integerAddSub(20);
      if (grade === 2) return Math.random() > 0.45 ? integerAddSub(100) : mulDivAddSub();
      if (grade <= 4) return Math.random() > 0.35 ? mulDivAddSub() : integerAddSub(grade === 3 ? 1000 : 10000);
      return Math.random() > 0.45 ? decimalFractionPercent() : mulDivAddSub();
    }
    function makeVertical(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const verticalQuestion = (data) => baseQuestion(point, {
        ...data,
        vertical: data.vertical || verticalSpecFromText(data.text),
        templateType: data.templateType || "竖式计算"
      });
      const makeAdd = (max) => {
        const a = rand(Math.max(2, Math.floor(max * 0.18)), Math.max(3, Math.floor(max * 0.72)));
        const b = rand(2, Math.max(3, max - a));
        const answer = a + b;
        return verticalQuestion({
          text: `用竖式计算：${a} + ${b} = ?`,
          answer,
          explanation: `竖式加法要把个位、十位等相同数位对齐，从个位算起；个位满十时向十位进 1，结果是 ${answer}。`,
          steps: [`第一步：把 ${a} 和 ${b} 的个位对齐。`, `第二步：从个位加起，满十就向前一位进 1。`, `第三步：得到 ${a} + ${b} = ${answer}。`]
        });
      };
      const makeSub = (max) => {
        const a = rand(Math.max(8, Math.floor(max * 0.45)), max);
        const b = rand(2, Math.max(3, Math.floor(a * 0.68)));
        const answer = a - b;
        return verticalQuestion({
          text: `用竖式计算：${a} - ${b} = ?`,
          answer,
          explanation: `竖式减法要把相同数位对齐，从个位减起；个位不够减时向十位退 1，结果是 ${answer}。`,
          steps: [`第一步：把 ${a} 和 ${b} 的个位对齐。`, `第二步：从个位减起，不够减就向前一位退 1。`, `第三步：得到 ${a} - ${b} = ${answer}。`]
        });
      };
      const makeMissingAddend = (max) => {
        const total = rand(Math.max(8, Math.floor(max * 0.45)), max);
        const known = rand(2, Math.max(3, Math.floor(total * 0.62)));
        const answer = total - known;
        return verticalQuestion({
          text: `用竖式计算：${known} + □ = ${total}，□ = ?`,
          answer,
          explanation: `缺数竖式可以用减法验算。把 ${total} 和 ${known} 按数位对齐，用 ${total} - ${known} 求出缺少的数，结果是 ${answer}。`,
          steps: [`第一步：把 ${total} 写在上面，${known} 写在下面，数位对齐。`, `第二步：用竖式算 ${total} - ${known}。`, `第三步：缺少的数是 ${answer}。`]
        });
      };
      const makeMul = () => {
        const a = rand(grade <= 3 ? 22 : 108, grade <= 3 ? 98 : 860 + level * 40);
        const b = rand(grade <= 3 ? 2 : 12, grade <= 3 ? 9 : 46);
        const answer = a * b;
        return verticalQuestion({
          text: `用竖式计算：${a} × ${b} = ?`,
          answer,
          explanation: `竖式乘法要把乘数按数位对齐，先算个位上的乘积，再处理十位上的乘积，最后把部分积相加。结果是 ${answer}。`,
          steps: [`第一步：把 ${a} 和 ${b} 按数位写成竖式。`, `第二步：从个位开始逐位相乘，注意进位。`, `第三步：部分积相加，${a} × ${b} = ${answer}。`]
        });
      };
      const makeDiv = () => {
        const divisor = rand(grade <= 3 ? 2 : 6, grade <= 3 ? 9 : 24);
        const quotient = rand(grade <= 3 ? 12 : 18, grade <= 3 ? 96 : 220 + level * 18);
        const dividend = divisor * quotient;
        return verticalQuestion({
          text: `用竖式计算：${dividend} ÷ ${divisor} = ?`,
          answer: quotient,
          explanation: `竖式除法要从高位开始试商，商要写在对应数位上，每一步乘回去再相减。结果是 ${quotient}。`,
          steps: [`第一步：从 ${dividend} 的高位开始看够不够除以 ${divisor}。`, `第二步：试商后乘回去，再相减。`, `第三步：继续下一位，得到 ${dividend} ÷ ${divisor} = ${quotient}。`]
        });
      };
      const makeDecimal = () => {
        const a = round1(rand(120, 980 + level * 20) / 10);
        const b = round1(rand(18, 260) / 10);
        if (Math.random() > 0.45) {
          const answer = round1(a + b);
          return verticalQuestion({
            text: `用竖式计算：${formatAnswer(a)} + ${formatAnswer(b)} = ?`,
            answer,
            explanation: `小数竖式加法要先把小数点对齐，再把相同数位对齐，按整数加法计算。结果是 ${formatAnswer(answer)}。`,
            steps: [`第一步：把 ${formatAnswer(a)} 和 ${formatAnswer(b)} 的小数点对齐。`, `第二步：从最低位加起，注意进位。`, `第三步：小数点落在同一列，答案是 ${formatAnswer(answer)}。`]
          });
        }
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        const answer = round1(big - small);
        return verticalQuestion({
          text: `用竖式计算：${formatAnswer(big)} - ${formatAnswer(small)} = ?`,
          answer,
          explanation: `小数竖式减法要把小数点对齐，位数不够时可以补 0，再按整数减法计算。结果是 ${formatAnswer(answer)}。`,
          steps: [`第一步：把小数点对齐，位数不够可以补 0。`, `第二步：从最低位减起，不够减就退位。`, `第三步：答案是 ${formatAnswer(answer)}。`]
        });
      };
      if (grade === 1) return pick([() => makeAdd(20), () => makeSub(20), () => makeMissingAddend(20)])();
      if (grade === 2) return pick([() => makeAdd(100), () => makeSub(100), () => makeMissingAddend(100)])();
      if (grade === 3) return pick([() => makeAdd(1000), () => makeSub(1000), makeMul, makeDiv])();
      if (grade === 4) return Math.random() > 0.42 ? pick([makeMul, makeDiv])() : pick([() => makeAdd(10000), () => makeSub(10000)])();
      if (grade === 5) return Math.random() > 0.35 ? makeDecimal() : pick([makeMul, makeDiv])();
      return pick([makeDecimal, makeMul, makeDiv, () => makeAdd(100000), () => makeSub(100000)])();
    }
    function makeLarge(point, level) {
      const variants = [
        () => {
          const a = rand(1200, 9000 + level * 18000);
          const b = rand(300, 5000 + level * 9000);
          const c = Math.floor(b / 2);
          return baseQuestion(point, {
            text: `${a} + ${b} - ${c} = ?`,
            answer: a + b - c,
            explanation: `大数计算不要急，按从左到右的顺序分两步。先算 ${a} + ${b}，再减去 ${c}。`,
            steps: [`先算 ${a} + ${b} = ${a + b}。`, `再算 ${a + b} - ${c} = ${a + b - c}。`]
          });
        },
        () => {
          const a = rand(12000, 98000);
          const b = rand(2000, 18000);
          const c = rand(1000, 9000);
          const answer = a - b + c;
          return baseQuestion(point, {
            text: `${a} - ${b} + ${c} = ?`,
            answer,
            explanation: `同级运算从左往右算。先算 ${a} - ${b} = ${a - b}，再加 ${c}，得到 ${answer}。`,
            steps: [`先算减法：${a} - ${b} = ${a - b}。`, `再算加法：${a - b} + ${c} = ${answer}。`]
          });
        },
        () => {
          const unit = pick([10, 100, 1000, 10000]);
          const count = rand(12, 98 + level * 20);
          const add = rand(3, 45) * (unit / 10);
          const answer = count * unit + add;
          return baseQuestion(point, {
            text: `${count} 个 ${unit} 加上 ${add} 是多少？`,
            answer,
            explanation: `先把 ${count} 个 ${unit} 看成 ${count} × ${unit} = ${count * unit}，再加 ${add}。`,
            steps: [`${count} × ${unit} = ${count * unit}。`, `${count * unit} + ${add} = ${answer}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function rectangleGridCells(rows, cols) {
      const cells = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) cells.push({ x, y });
      }
      return cells;
    }
    function lShapeGridCells(rows, cols, cutRows, cutCols) {
      const cells = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const inCut = x >= cols - cutCols && y >= rows - cutRows;
          if (!inCut) cells.push({ x, y });
        }
      }
      return cells;
    }
    function gridPerimeter(cells) {
      const filled = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
      return cells.reduce((total, cell) => {
        return total + [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !filled.has(`${cell.x + dx},${cell.y + dy}`)).length;
      }, 0);
    }
    function makeAngleTriangleGeometry(point, level) {
      const variant = rand(1, 5);
      if (variant === 1) {
        const angle = pick([35, 60, 90, 115, 140]);
        const answer = angle < 90 ? 1 : angle === 90 ? 2 : 3;
        return baseQuestion(point, {
          text: `看角的度量图，图中角是 ${angle}°。旁边标出的边长只是干扰条件。输入 1=锐角，2=直角，3=钝角，这个角属于哪一类？`,
          answer,
          word: true,
          diagram: { type: "angle-measure", angle, length: rand(5, 9), caption: "分类看角度大小，不看边画得多长" },
          explanation: `判断角的类型只看角的大小。小于 90° 是锐角，等于 90° 是直角，大于 90° 小于 180° 是钝角，所以答案是 ${answer}。`,
          steps: [`先读角度：${angle}°。`, `忽略边长，边长不决定角的类型。`, `按锐角、直角、钝角的标准选择 ${answer}。`],
          templateType: "角的分类"
        });
      }
      if (variant === 2) {
        const known = rand(35, 145);
        const answer = 180 - known;
        return baseQuestion(point, {
          text: `一条直线上有两个相邻的角，其中一个角是 ${known}°，线段长 ${rand(4, 12)} cm 是干扰条件。另一个角是多少度？`,
          answer,
          word: true,
          diagram: { type: "angle-measure", angle: known, length: rand(4, 12), caption: "一条直线上的相邻角合起来是 180°" },
          explanation: `直线上的相邻两个角组成平角，合起来是 180°。所以另一个角是 180 - ${known} = ${answer}°。`,
          steps: [`先判断是平角关系。`, `平角总度数是 180°。`, `180 - ${known} = ${answer}°。`],
          templateType: "平角求角"
        });
      }
      if (variant === 3) {
        const a = rand(35, 70);
        const b = rand(45, 85);
        const answer = 180 - a - b;
        return baseQuestion(point, {
          text: `三角形中两个内角分别是 ${a}° 和 ${b}°，一条边长 ${rand(5, 13)} cm 是干扰条件。第三个内角是多少度？`,
          answer,
          word: true,
          diagram: { type: "polygon-shape", mode: "triangle", angle: a, angle2: b, a: answer, side: rand(5, 13), caption: "三角形三个内角和是 180°" },
          explanation: `三角形内角和是 180°。已知两个角后，用 180° 减去这两个角：180 - ${a} - ${b} = ${answer}°。`,
          steps: [`写出内角和：180°。`, `先减去 ${a}° 和 ${b}°。`, `第三个角是 ${answer}°。`],
          templateType: "三角形内角和"
        });
      }
      if (variant === 4) {
        const mode = rand(1, 3);
        const side = rand(4, 9);
        const side2 = mode <= 2 ? side : side + rand(1, 4);
        const side3 = mode === 1 ? side : mode === 2 ? side + rand(1, 4) : side2 + rand(1, 3);
        const answer = mode === 1 ? 2 : mode === 2 ? 1 : 3;
        return baseQuestion(point, {
          text: `按边分类：三角形三条边分别是 ${side} cm、${side2} cm、${side3} cm，旁边写的周长标签不用先算。输入 1=等腰，2=等边，3=普通三角形。它属于哪类？`,
          answer,
          word: true,
          diagram: { type: "polygon-shape", mode: "triangle", angle: 60, angle2: 60, a: 60, side, caption: "分类先看边是否相等" },
          explanation: `按边分类先比较三条边。${answer === 2 ? "三条边都相等，是等边三角形。" : answer === 1 ? "有两条边相等，是等腰三角形。" : "三条边都不相等，是普通三角形。"}所以选择 ${answer}。`,
          steps: [`比较 ${side}、${side2}、${side3}。`, `不要先被周长标签带走。`, `按边相等情况选择 ${answer}。`],
          templateType: "三角形分类"
        });
      }
      const top = rand(5, 9);
      const bottom = top + rand(3, 7);
      return baseQuestion(point, {
        text: `看梯形图，图中上底和下底互相平行，腰长数字是干扰条件。这个梯形有几组互相平行的对边？`,
        answer: 1,
        word: true,
        diagram: { type: "polygon-shape", mode: "trapezoid", base: top, base2: bottom, side: rand(4, 8), caption: "梯形只有一组对边平行" },
        explanation: `梯形的特征是只有一组对边平行。上底和下底平行，左右两条腰不平行，所以有 1 组平行对边。`,
        steps: [`先找互相平行的边。`, `上底和下底是一组。`, `两条腰不是一组平行边，答案是 1。`],
        templateType: "四边形特征"
      });
    }
    function makeMotionAreaGeometry(point, level) {
      const variant = rand(1, 7);
      if (variant === 1) {
        const base = rand(8, 16);
        const height = rand(4, 10);
        const side = height + rand(2, 6);
        return baseQuestion(point, {
          text: `平行四边形底是 ${base} cm，高是 ${height} cm，邻边 ${side} cm 是干扰条件。面积是多少平方厘米？`,
          answer: base * height,
          word: true,
          diagram: { type: "polygon-area", mode: "parallelogram", base, height, side, caption: "平行四边形面积用底乘高" },
          explanation: `平行四边形面积 = 底 × 高。邻边长度不能代替高，所以面积是 ${base} × ${height} = ${base * height} 平方厘米。`,
          steps: [`找底 ${base} cm。`, `找对应高 ${height} cm。`, `${base} × ${height} = ${base * height} 平方厘米。`],
          templateType: "平行四边形面积"
        });
      }
      if (variant === 2) {
        const base = rand(8, 18);
        const height = pick([4, 6, 8, 10, 12]);
        const answer = base * height / 2;
        return baseQuestion(point, {
          text: `三角形底是 ${base} cm，高是 ${height} cm，斜边数字是干扰条件。面积是多少平方厘米？`,
          answer,
          word: true,
          diagram: { type: "polygon-area", mode: "triangle", base, height, side: rand(6, 15), caption: "三角形面积要除以 2" },
          explanation: `三角形面积 = 底 × 高 ÷ 2。用对应的底和高计算：${base} × ${height} ÷ 2 = ${answer} 平方厘米。`,
          steps: [`找底 ${base} cm。`, `找对应高 ${height} cm。`, `${base} × ${height} ÷ 2 = ${answer} 平方厘米。`],
          templateType: "三角形面积"
        });
      }
      if (variant === 3) {
        const top = rand(4, 9);
        const bottom = top + rand(4, 10);
        const height = pick([4, 6, 8, 10]);
        const answer = (top + bottom) * height / 2;
        return baseQuestion(point, {
          text: `梯形上底 ${top} cm、下底 ${bottom} cm、高 ${height} cm，腰长是干扰条件。面积是多少平方厘米？`,
          answer,
          word: true,
          diagram: { type: "polygon-area", mode: "trapezoid", base: bottom, base2: top, height, side: rand(5, 11), caption: "梯形面积用上下底的和" },
          explanation: `梯形面积 = (上底 + 下底) × 高 ÷ 2，所以是 (${top} + ${bottom}) × ${height} ÷ 2 = ${answer} 平方厘米。`,
          steps: [`先把上底和下底相加：${top} + ${bottom} = ${top + bottom}。`, `乘高 ${height}。`, `再除以 2，得到 ${answer}。`],
          templateType: "梯形面积"
        });
      }
      if (variant === 4) {
        const cols = 7;
        const rows = 5;
        const startX = rand(0, 2);
        const startY = rand(1, 3);
        const endX = cols - 1 - startX;
        return baseQuestion(point, {
          text: `看轴对称图，蓝色方块关于红色虚线对称后到黄色位置。若从左往右数列数，黄色方块在第几列？`,
          answer: endX + 1,
          word: true,
          diagram: { type: "symmetry-grid", rows, cols, startX, startY, endX, endY: startY, caption: "对称点到对称轴的距离相等" },
          explanation: `轴对称后，对称点到虚线的格数相同、方向相反。黄色方块在从左往右第 ${endX + 1} 列。`,
          steps: [`数蓝色方块到对称轴的距离。`, `在另一侧数相同格数。`, `黄色位置是第 ${endX + 1} 列。`],
          templateType: "轴对称位置"
        });
      }
      if (variant === 5) {
        return baseQuestion(point, {
          text: `看旋转图，蓝点绕中心顺时针旋转 90° 到黄色位置。输入 1=上方，2=右方，3=下方，4=左方，旋转后在中心的哪一方？`,
          answer: 2,
          word: true,
          diagram: { type: "rotation-grid", startX: 2, startY: 1, endX: 3, endY: 2, caption: "顺时针 90°：上方转到右方" },
          explanation: `绕中心顺时针旋转 90°，原来在上方的位置会转到右方，所以选择 2。`,
          steps: [`先确定旋转中心。`, `再判断顺时针方向。`, `上方转到右方，答案是 2。`],
          templateType: "旋转读图"
        });
      }
      if (variant === 6) {
        return baseQuestion(point, {
          text: `看正方体展开图，图中已经有 5 个正方形面，编号只是帮助读图。至少还缺几个正方形面才能组成正方体展开图？`,
          answer: 1,
          word: true,
          diagram: { type: "solid-net", mode: "cube5", caption: "正方体展开图需要 6 个正方形面" },
          explanation: `正方体有 6 个面，展开图也需要 6 个正方形。图中已有 5 个，所以还缺 1 个。`,
          steps: [`正方体一共有 6 个面。`, `图中已有 5 个正方形。`, `6 - 5 = 1。`],
          templateType: "展开图判断"
        });
      }
      const columns = Array.from({ length: rand(3, 5) }, () => rand(1, 4));
      return baseQuestion(point, {
        text: `看三视图示意，积木从上面看能看到几列小正方形？每列有几层是正面图要用的信息，这里是干扰条件。`,
        answer: columns.length,
        word: true,
        diagram: { type: "three-view", columns, caption: "上面看只看占了几个位置" },
        explanation: `从上面看，只看底部占了几列位置，不看每列堆了几层。图中一共有 ${columns.length} 列。`,
        steps: [`先切换到上面看。`, `只数占地位置。`, `共有 ${columns.length} 列。`],
        templateType: "三视图"
      });
    }
    function makeSolidPositionGeometry(point, level) {
      const variant = rand(1, 7);
      if (variant === 1) {
        const east = rand(200, 800);
        const north = rand(150, 650);
        return baseQuestion(point, {
          text: `路线图中，从学校先向东走 ${east} m，再向北走 ${north} m 到图书馆，用时 ${rand(5, 18)} 分钟是干扰条件。图书馆在学校的哪个方向？输入 1=东北，2=东南，3=西北，4=西南。`,
          answer: 1,
          word: true,
          diagram: { type: "route-map", east, north, caption: "先东再北，终点在东北方向" },
          explanation: `从起点向东再向北，终点相对起点在东北方向。用时不影响方向判断，所以选择 1。`,
          steps: [`先看横向：向东。`, `再看纵向：向北。`, `东和北合起来是东北。`],
          templateType: "位置方向读图"
        });
      }
      if (variant === 2) {
        const mapCm = rand(3, 8);
        const scale = pick([1000, 2000, 5000]);
        const answer = mapCm * scale / 100;
        return baseQuestion(point, {
          text: `路线图上两地距离 ${mapCm} cm，比例尺是 1:${scale}，旁边的路口编号不用计算。实际距离是多少米？`,
          answer,
          word: true,
          diagram: { type: "route-map", east: mapCm * 100, north: 0, distance: mapCm, scale, caption: "比例尺先换算成实际厘米，再化成米" },
          explanation: `实际距离 = 图上距离 × 比例尺后项。${mapCm} × ${scale} = ${mapCm * scale} cm，也就是 ${answer} m。`,
          steps: [`图上距离 ${mapCm} cm。`, `实际厘米：${mapCm} × ${scale} = ${mapCm * scale} cm。`, `换成米：${mapCm * scale} ÷ 100 = ${answer} m。`],
          templateType: "比例尺路线"
        });
      }
      if (variant === 3) {
        const r = rand(2, 6);
        const h = rand(5, 12);
        const answer = round1(3.14 * r * r * h);
        return baseQuestion(point, {
          text: `圆柱半径 ${r} cm，高 ${h} cm，侧面颜色是干扰条件。体积约是多少立方厘米？（π取3.14）`,
          answer,
          word: true,
          diagram: { type: "cylinder-cone", mode: "cylinder", radius: r, height: h, caption: "圆柱体积 = 底面积 × 高" },
          explanation: `圆柱体积 = πr²h。代入半径 ${r}、高 ${h}：3.14 × ${r} × ${r} × ${h} = ${formatAnswer(answer)}。`,
          steps: [`先算底面积：3.14 × ${r} × ${r}。`, `再乘高 ${h}。`, `体积约 ${formatAnswer(answer)} 立方厘米。`],
          templateType: "圆柱体积"
        });
      }
      if (variant === 4) {
        const r = rand(3, 6);
        const h = pick([6, 9, 12, 15]);
        const answer = round1(3.14 * r * r * h / 3);
        return baseQuestion(point, {
          text: `圆锥底面半径 ${r} cm，高 ${h} cm，母线长度暂时不用。体积约是多少立方厘米？（π取3.14）`,
          answer,
          word: true,
          diagram: { type: "cylinder-cone", mode: "cone", radius: r, height: h, caption: "圆锥体积要除以 3" },
          explanation: `圆锥体积 = 1/3 × πr²h。代入后是 3.14 × ${r} × ${r} × ${h} ÷ 3 = ${formatAnswer(answer)}。`,
          steps: [`先算同底等高圆柱体积。`, `圆锥是它的 1/3。`, `结果约 ${formatAnswer(answer)} 立方厘米。`],
          templateType: "圆锥体积"
        });
      }
      if (variant === 5) {
        return baseQuestion(point, {
          text: `等底等高的圆柱和圆锥，包装颜色不同是干扰条件。圆柱体积是圆锥体积的几倍？`,
          answer: 3,
          word: true,
          diagram: { type: "cylinder-cone", mode: "cone", radius: 4, height: 9, caption: "等底等高时，圆柱体积是圆锥的 3 倍" },
          explanation: `等底等高时，圆锥体积是圆柱体积的 1/3，所以圆柱体积是圆锥的 3 倍。`,
          steps: [`比较的是等底等高。`, `圆锥体积公式有 ÷3。`, `所以圆柱是圆锥的 3 倍。`],
          templateType: "等底等高关系"
        });
      }
      if (variant === 6) {
        const r = rand(4, 10);
        const angle = pick([60, 90, 120, 150]);
        const answer = round1(3.14 * r * r * angle / 360);
        return baseQuestion(point, {
          text: `扇形半径 ${r} cm，圆心角 ${angle}°，弧上的装饰线长度是干扰条件。扇形面积约是多少平方厘米？（π取3.14）`,
          answer,
          word: true,
          diagram: { type: "sector-shape", radius: r, angle, caption: "扇形面积看圆心角占整圆的几分之几" },
          explanation: `扇形面积 = 圆面积 × 圆心角/360。3.14 × ${r} × ${r} × ${angle}/360 ≈ ${formatAnswer(answer)}。`,
          steps: [`先算整圆面积：3.14 × ${r} × ${r}。`, `扇形占 ${angle}/360。`, `面积约 ${formatAnswer(answer)} 平方厘米。`],
          templateType: "扇形面积"
        });
      }
      const r = rand(3, 10);
      const answer = round1(3.14 * r + 2 * r);
      return baseQuestion(point, {
        text: `半圆半径 ${r} cm，涂色部分面积不用求。这个半圆的周长约是多少厘米？（π取3.14）`,
        answer,
        word: true,
        diagram: { type: "sector-shape", mode: "semicircle", radius: r, caption: "半圆周长 = 半个圆周长 + 直径" },
        explanation: `半圆周长不是圆周长的一半，还要加直径。半个圆周长是 3.14 × ${r}，直径是 ${2 * r}，合起来约 ${formatAnswer(answer)} cm。`,
        steps: [`半个圆周长：3.14 × ${r}。`, `直径：${r} × 2 = ${2 * r}。`, `合起来约 ${formatAnswer(answer)} cm。`],
        templateType: "半圆周长"
      });
    }
    function makeGeometry(point, level) {
      if (point.id === "g4-angle-triangle") return makeAngleTriangleGeometry(point, level);
      if (point.id === "g5-geometry-motion") return makeMotionAreaGeometry(point, level);
      if (point.id === "g6-solid-position") return makeSolidPositionGeometry(point, level);
      if (point.id === "g1-shape") {
        if (Math.random() > 0.5) {
          const circles = rand(3, 8);
          const squares = rand(2, 7);
          return baseQuestion(point, {
            text: `图形卡片里有 ${circles} 个圆形和 ${squares} 个正方形，一共有多少个图形？`,
            answer: circles + squares,
            word: true,
            diagram: { type: "shape-count", shapes: [{ kind: "circle", count: circles, label: "圆形" }, { kind: "square", count: squares, label: "正方形" }], caption: "数一数图形卡片" },
            explanation: `数图形时按种类分别数，再合起来。${circles} 个圆形加 ${squares} 个正方形，一共 ${circles + squares} 个。`,
            steps: [`圆形 ${circles} 个。`, `正方形 ${squares} 个。`, `${circles} + ${squares} = ${circles + squares} 个。`]
          });
        }
        const left = rand(2, 6);
        const right = rand(1, 5);
        return baseQuestion(point, {
          text: `小猫排在队伍中，左边有 ${left} 人，右边有 ${right} 人。队伍一共有多少人？`,
          answer: left + right + 1,
          word: true,
          diagram: { type: "position-row", left, right, caption: "排队时不要漏掉自己" },
          explanation: `位置题要把自己也算进去。左边 ${left} 人，右边 ${right} 人，再加小猫自己 1 人。`,
          steps: [`左边 ${left} 人。`, `右边 ${right} 人。`, `总人数：${left} + 1 + ${right} = ${left + right + 1}。`]
        });
      }
      if (point.id === "g2-angle-view") {
        const variant = rand(1, 4);
        if (variant === 1) {
          const right = rand(1, 3);
          const acute = rand(1, 2);
          const obtuse = rand(1, 2);
          const angles = shuffle([
            ...Array.from({ length: right }, () => ({ type: "right" })),
            ...Array.from({ length: acute }, () => ({ type: "acute" })),
            ...Array.from({ length: obtuse }, () => ({ type: "obtuse" }))
          ]).map((angle, index) => ({ ...angle, label: String(index + 1) }));
          return baseQuestion(point, {
            text: `看图数一数，图中有几个直角？`,
            answer: right,
            word: true,
            diagram: { type: "angle-set", angles, caption: "直角像方方正正的墙角" },
            explanation: `直角的两条边像横线和竖线，角上能放进一个小正方形标记。图中这样的角有 ${right} 个。`,
            steps: [`先找带小方角标记的角。`, `不要把锐角、钝角算进去。`, `直角一共有 ${right} 个。`],
            templateType: "数直角"
          });
        }
        if (variant === 2) {
          const cols = 6;
          const rows = 4;
          const startX = rand(0, 2);
          const startY = rand(1, 2);
          const move = rand(2, 3);
          const endX = startX + move;
          return baseQuestion(point, {
            text: `看平移图，蓝色图形向右平移到黄色位置，一共平移了几格？`,
            answer: move,
            word: true,
            diagram: { type: "motion-grid", rows, cols, startX, startY, endX, endY: startY, caption: "平移时形状和大小不变，只看移动了几格" },
            explanation: `平移要数同一个点移动了几格。图中从蓝色位置到黄色位置，向右数 ${move} 格，所以平移了 ${move} 格。`,
            steps: [`先找到平移前的蓝色图形。`, `再看平移后的黄色图形。`, `横向数出移动了 ${move} 格。`],
            templateType: "图形运动"
          });
        }
        if (variant === 3) {
          const columns = Array.from({ length: rand(3, 5) }, () => rand(1, 4));
          const answer = Math.max(...columns);
          return baseQuestion(point, {
            text: `看正方体小积木图，从正面看，最高的一列有几层？`,
            answer,
            word: true,
            diagram: { type: "block-view", columns, caption: "从正面观察，先看每一列有几层" },
            explanation: `观察物体时先按列看。图中每列层数是 ${columns.join("、")}，最高的一列有 ${answer} 层。`,
            steps: [`从左到右读出每列层数：${columns.join("、")}。`, `比较这些层数。`, `最高是 ${answer} 层。`],
            templateType: "观察物体"
          });
        }
        const ab = rand(3, 8);
        const bc = rand(2, 7);
        return baseQuestion(point, {
          text: `看线段图，AB 长 ${ab} cm，BC 长 ${bc} cm，AC 长多少厘米？`,
          answer: ab + bc,
          word: true,
          diagram: { type: "segment-chain", length: ab, width: bc, caption: "AC 由 AB 和 BC 连起来" },
          explanation: `线段 AC 被 B 点分成 AB 和 BC 两段，所以 AC = AB + BC。${ab} + ${bc} = ${ab + bc} cm。`,
          steps: [`读图：AB 是 ${ab} cm，BC 是 ${bc} cm。`, `AC 是两段合起来。`, `${ab} + ${bc} = ${ab + bc} cm。`],
          templateType: "线段合成"
        });
      }
      if (point.id === "g5-volume") {
        const length = rand(4, 12 + level);
        const width = rand(3, 9 + level);
        const height = rand(2, 8 + level);
        if (Math.random() > 0.72) {
          const columns = Array.from({ length: rand(3, 5) }, () => rand(1, 4));
          const answer = columns.reduce((sum, value) => sum + value, 0);
          return baseQuestion(point, {
            text: `看正方体小积木搭成的立体图形，每个小正方体体积是 1 立方厘米，一共有多少立方厘米？`,
            answer,
            word: true,
            diagram: { type: "block-view", columns, caption: "每一层小正方体都要数到" },
            explanation: `这个立体图形按列数小正方体：${columns.join("、")}，合起来是 ${columns.join(" + ")} = ${answer} 个小正方体，所以体积是 ${answer} 立方厘米。`,
            steps: [`从左到右数每列小正方体：${columns.join("、")}。`, `把每列个数相加。`, `${columns.join(" + ")} = ${answer} 立方厘米。`],
            templateType: "观察物体"
          });
        }
        if (Math.random() > 0.45) {
          const answer = length * width * height;
          return baseQuestion(point, {
            text: `长方体长 ${length} cm，宽 ${width} cm，高 ${height} cm，体积是多少立方厘米？`,
            answer,
            word: true,
            diagram: { type: "cuboid", length, width, height, caption: "长方体体积看三个方向" },
            explanation: `长方体体积 = 长 × 宽 × 高。把三个方向的长度相乘：${length} × ${width} × ${height} = ${answer}。`,
            steps: [`写公式：体积 = 长 × 宽 × 高。`, `代入：${length} × ${width} × ${height}。`, `结果是 ${answer} 立方厘米。`]
          });
        }
        if (Math.random() > 0.55) {
          const answer = 4 * (length + width + height);
          return baseQuestion(point, {
            text: `长方体长 ${length} cm，宽 ${width} cm，高 ${height} cm，棱长总和是多少厘米？`,
            answer,
            word: true,
            diagram: { type: "cuboid", length, width, height, caption: "长方体有 4 组长、宽、高" },
            explanation: `长方体有 4 条长、4 条宽、4 条高，棱长总和 =（长 + 宽 + 高）× 4。`,
            steps: [`先算一组长宽高：${length} + ${width} + ${height} = ${length + width + height}。`, `共有 4 组。`, `${length + width + height} × 4 = ${answer} cm。`],
            templateType: "棱长总和"
          });
        }
        const answer = 2 * (length * width + length * height + width * height);
        return baseQuestion(point, {
          text: `长方体长 ${length} cm，宽 ${width} cm，高 ${height} cm，表面积是多少平方厘米？`,
          answer,
          word: true,
          diagram: { type: "cuboid", length, width, height, caption: "表面积要算 3 组相对的面" },
          explanation: `长方体表面积有 3 组相同的面。先算长×宽、长×高、宽×高，再把和乘 2。`,
          steps: [`三个不同面的面积：${length * width}、${length * height}、${width * height}。`, `和是 ${length * width + length * height + width * height}。`, `表面积：${length * width + length * height + width * height} × 2 = ${answer}。`]
        });
      }
      if (point.id === "g6-circle") {
        const r = rand(3, 12);
        if (Math.random() > 0.78) {
          const inner = rand(2, Math.max(2, r - 1));
          const answer = round1(3.14 * (r * r - inner * inner));
          return baseQuestion(point, {
            text: `圆环外半径是 ${r} cm，内半径是 ${inner} cm，圆环面积约是多少平方厘米？（π取3.14）`,
            answer,
            word: true,
            diagram: { type: "circle-ring", radius: r, innerRadius: inner, caption: "圆环面积 = 外圆面积 - 内圆面积" },
            explanation: `圆环面积要用外圆面积减内圆面积。3.14 × (${r} × ${r} - ${inner} × ${inner}) = ${formatAnswer(answer)} 平方厘米。`,
            steps: [`外圆半径是 ${r} cm，内圆半径是 ${inner} cm。`, `先算半径平方差：${r * r} - ${inner * inner} = ${r * r - inner * inner}。`, `3.14 × ${r * r - inner * inner} = ${formatAnswer(answer)} 平方厘米。`],
            templateType: "圆环面积"
          });
        }
        if (Math.random() > 0.5) {
          const answer = round1(2 * 3.14 * r);
          return baseQuestion(point, {
            text: `圆的半径是 ${r} cm，周长约是多少 cm？（π取3.14）`,
            answer,
            word: true,
            diagram: { type: "circle", radius: r, mode: "radius", caption: "半径是圆心到圆上一点" },
            explanation: `圆周长公式是 C = 2πr。代入半径 ${r}，2 × 3.14 × ${r} = ${formatAnswer(answer)}。`,
            steps: [`写公式：C = 2πr。`, `代入：2 × 3.14 × ${r}。`, `周长约 ${formatAnswer(answer)} cm。`]
          });
        }
        if (Math.random() > 0.5) {
          const diameter = r * 2;
          const answer = round1(3.14 * diameter);
          return baseQuestion(point, {
            text: `圆的直径是 ${diameter} cm，周长约是多少 cm？（π取3.14）`,
            answer,
            word: true,
            diagram: { type: "circle", diameter, mode: "diameter", caption: "直径穿过圆心" },
            explanation: `已知直径时，圆周长 C = πd。3.14 × ${diameter} = ${formatAnswer(answer)} cm。`,
            steps: [`找到直径 ${diameter} cm。`, `用公式 C = πd。`, `3.14 × ${diameter} = ${formatAnswer(answer)} cm。`],
            templateType: "直径求周长"
          });
        }
        const answer = round1(3.14 * r * r);
        return baseQuestion(point, {
          text: `圆的半径是 ${r} cm，面积约是多少平方厘米？（π取3.14）`,
          answer,
          word: true,
          diagram: { type: "circle", radius: r, mode: "radius", caption: "面积要用半径乘半径" },
          explanation: `圆面积公式是 S = πr²。半径 ${r}，所以面积是 3.14 × ${r} × ${r}。`,
          steps: [`写公式：S = πr²。`, `代入：3.14 × ${r} × ${r}。`, `面积约 ${formatAnswer(answer)} 平方厘米。`]
        });
      }
      const length = rand(5, 18 + level * 4);
      const width = rand(3, Math.max(4, length - 1));
      if (point.id.includes("perimeter")) {
        const variant = rand(1, 4);
        if (variant === 1) {
          const answer = (length + width) * 2;
          return baseQuestion(point, {
            text: `长方形长 ${length} cm，宽 ${width} cm，周长是多少 cm？`,
            answer,
            word: true,
            diagram: { type: "rectangle", length, width, unit: "cm", caption: "周长是围图形一圈" },
            explanation: `周长是绕图形一圈的长度。长方形周长 =（长 + 宽）× 2，所以是（${length} + ${width}）× 2 = ${answer} cm。`,
            steps: [`先把长和宽加起来：${length} + ${width} = ${length + width}。`, `长方形有两组长和宽，所以乘 2。`, `${length + width} × 2 = ${answer} cm。`]
          });
        }
        if (variant === 2) {
          const half = length + width;
          return baseQuestion(point, {
            text: `长方形的一组长和宽合起来是 ${half} cm，周长是多少 cm？`,
            answer: half * 2,
            word: true,
            diagram: { type: "rectangle", length, width, unit: "cm", caption: "一组长宽和是周长的一半" },
            explanation: `长方形周长由两组"长 + 宽"组成。一组长宽和是 ${half} cm，所以周长是 ${half} × 2 = ${half * 2} cm。`,
            steps: [`一组长宽和是 ${half} cm。`, `长方形有两组长宽和。`, `${half} × 2 = ${half * 2} cm。`],
            templateType: "周长关系"
          });
        }
        if (variant === 3) {
          const rows = rand(2, 4);
          const cols = rand(3, 6);
          const cells = rectangleGridCells(rows, cols);
          const answer = gridPerimeter(cells);
          return baseQuestion(point, {
            text: `看方格图，每个小方格边长 1 cm，涂色长方形的周长是多少 cm？`,
            answer,
            word: true,
            diagram: { type: "grid-shape", rows, cols, cells, unit: "cm", caption: "数外边一圈，不数里面的线" },
            explanation: `周长只数涂色图形外面一圈。这个长方形有 ${rows} 行、${cols} 列，长是 ${cols} cm，宽是 ${rows} cm，周长是 (${cols} + ${rows}) × 2 = ${answer} cm。`,
            steps: [`数出长是 ${cols} cm，宽是 ${rows} cm。`, `周长是围一圈，不能数内部格线。`, `(${cols} + ${rows}) × 2 = ${answer} cm。`],
            templateType: "数格子周长"
          });
        }
        const side = rand(4, 18);
        return baseQuestion(point, {
          text: `正方形边长 ${side} cm，周长是多少 cm？`,
          answer: side * 4,
          word: true,
          diagram: { type: "square", side, unit: "cm", caption: "正方形四条边相等" },
          explanation: `正方形四条边一样长，周长 = 边长 × 4。${side} × 4 = ${side * 4} cm。`,
          steps: [`正方形有 4 条相同的边。`, `每条边 ${side} cm。`, `${side} × 4 = ${side * 4} cm。`]
        });
      }
      if (point.id === "g4-area") {
        const areaVariant = rand(1, 5);
        if (areaVariant === 1) {
          const rows = rand(3, 5);
          const cols = rand(4, 7);
          const cells = rectangleGridCells(rows, cols);
          const answer = cells.length;
          return baseQuestion(point, {
            text: `看方格图，每个小方格表示 1 平方厘米，涂色部分的面积是多少平方厘米？`,
            answer,
            word: true,
            diagram: { type: "grid-shape", rows, cols, cells, unit: "cm", caption: "面积是里面铺了多少个小方格" },
            explanation: `面积看图形里面铺了多少个 1 平方厘米的小方格。图中有 ${rows} 行、${cols} 列，所以面积是 ${rows} × ${cols} = ${answer} 平方厘米。`,
            steps: [`数出一共有 ${rows} 行。`, `每行有 ${cols} 个小方格。`, `${rows} × ${cols} = ${answer} 平方厘米。`],
            templateType: "数格子面积"
          });
        }
        if (areaVariant === 2) {
          const rows = rand(4, 6);
          const cols = rand(5, 7);
          const cutRows = rand(1, 2);
          const cutCols = rand(1, 2);
          const cells = lShapeGridCells(rows, cols, cutRows, cutCols);
          const answer = cells.length;
          return baseQuestion(point, {
            text: `看组合方格图，每个小方格表示 1 平方厘米，涂色部分面积是多少平方厘米？`,
            answer,
            word: true,
            diagram: { type: "grid-shape", rows, cols, cells, unit: "cm", caption: "可以先补成长方形，再减去缺口" },
            explanation: `先看外面大长方形面积是 ${rows} × ${cols} = ${rows * cols} 平方厘米，再减去右下角缺口 ${cutRows} × ${cutCols} = ${cutRows * cutCols} 平方厘米，剩下 ${answer} 平方厘米。`,
            steps: [`大长方形面积：${rows} × ${cols} = ${rows * cols}。`, `缺口面积：${cutRows} × ${cutCols} = ${cutRows * cutCols}。`, `${rows * cols} - ${cutRows * cutCols} = ${answer} 平方厘米。`],
            templateType: "组合图形拆分"
          });
        }
        if (areaVariant === 3) {
          const useArea = Math.random() > 0.5;
          return baseQuestion(point, {
            text: `给长方形花坛${useArea ? "铺满草皮" : "围一圈栏杆"}，应该主要计算哪一个？输入 1 表示周长，输入 2 表示面积。`,
            answer: useArea ? 2 : 1,
            word: true,
            diagram: { type: "rectangle", length, width, unit: "m", caption: "周长看外圈，面积看里面" },
            explanation: `${useArea ? "铺满草皮要看里面有多大，所以计算面积。" : "围栏杆要绕外面一圈，所以计算周长。"}周长和面积都和图形有关，但用途不同。`,
            steps: [`先读动作：${useArea ? "铺满" : "围一圈"}。`, `${useArea ? "铺满里面对应面积。" : "围外圈对应周长。"}`, `所以答案选 ${useArea ? 2 : 1}。`],
            templateType: "周长面积辨析"
          });
        }
        if (areaVariant === 4) {
          const outerLength = rand(10, 18);
          const outerWidth = rand(6, 12);
          const cutLength = rand(2, Math.min(6, outerLength - 5));
          const cutWidth = rand(2, Math.min(5, outerWidth - 3));
          const answer = outerLength * outerWidth - cutLength * cutWidth;
          return baseQuestion(point, {
            text: `看组合图形：外面长方形长 ${outerLength} m、宽 ${outerWidth} m，右下角挖去 ${cutLength} m × ${cutWidth} m 的小长方形，剩下面积是多少平方米？`,
            answer,
            word: true,
            diagram: { type: "composite-rect", a: outerLength, b: outerWidth, c: cutLength, d: cutWidth, caption: "组合图形可以先补成长方形" },
            explanation: `先算外面大长方形面积，再减去挖掉的小长方形面积。${outerLength} × ${outerWidth} - ${cutLength} × ${cutWidth} = ${answer}。`,
            steps: [`大长方形面积：${outerLength} × ${outerWidth} = ${outerLength * outerWidth}。`, `挖去面积：${cutLength} × ${cutWidth} = ${cutLength * cutWidth}。`, `剩下面积：${outerLength * outerWidth} - ${cutLength * cutWidth} = ${answer} 平方米。`],
            templateType: "组合图形拆分"
          });
        }
      }
      if (point.id === "g4-area" && Math.random() > 0.62) {
        const outerLength = rand(10, 18);
        const outerWidth = rand(6, 12);
        const cutLength = rand(2, Math.min(6, outerLength - 5));
        const cutWidth = rand(2, Math.min(5, outerWidth - 3));
        const answer = outerLength * outerWidth - cutLength * cutWidth;
        return baseQuestion(point, {
          text: `看组合图形：外面长方形长 ${outerLength} m、宽 ${outerWidth} m，右下角挖去 ${cutLength} m × ${cutWidth} m 的小长方形，剩下面积是多少平方米？`,
          answer,
          word: true,
          diagram: { type: "composite-rect", a: outerLength, b: outerWidth, c: cutLength, d: cutWidth, caption: "组合图形可以先补成长方形" },
          explanation: `先算外面大长方形面积，再减去挖掉的小长方形面积。${outerLength} × ${outerWidth} - ${cutLength} × ${cutWidth} = ${answer}。`,
          steps: [`大长方形面积：${outerLength} × ${outerWidth} = ${outerLength * outerWidth}。`, `挖去面积：${cutLength} × ${cutWidth} = ${cutLength * cutWidth}。`, `剩下面积：${outerLength * outerWidth} - ${cutLength * cutWidth} = ${answer} 平方米。`],
          templateType: "组合图形面积"
        });
      }
      if (Math.random() > 0.45) {
        const answer = length * width;
        return baseQuestion(point, {
          text: `长方形长 ${length} m，宽 ${width} m，面积是多少平方米？`,
          answer,
          word: true,
          diagram: { type: "rectangle", length, width, unit: "m", caption: "面积是铺满里面的大小" },
          explanation: `面积表示铺满里面有多大。长方形面积 = 长 × 宽，所以 ${length} × ${width} = ${answer} 平方米。`,
          steps: [`找到长 ${length} m、宽 ${width} m。`, `面积用长乘宽。`, `${length} × ${width} = ${answer} 平方米。`]
        });
      }
      const side = rand(5, 24);
      return baseQuestion(point, {
        text: `正方形边长 ${side} m，面积是多少平方米？`,
        answer: side * side,
        word: true,
        diagram: { type: "square", side, unit: "m", caption: "正方形面积是边长乘边长" },
        explanation: `正方形面积 = 边长 × 边长。${side} × ${side} = ${side * side} 平方米。`,
        steps: [`写公式：正方形面积 = 边长 × 边长。`, `代入：${side} × ${side}。`, `结果是 ${side * side} 平方米。`]
      });
    }
    function makeThinking(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const categoryPools = {
        1: ["quantity", "pattern", "open", "expression", "distractor"],
        2: ["estimation", "strategy", "correction", "life", "expression", "distractor"],
        3: ["estimation", "correction", "life", "pattern", "case", "quantity", "distractor"],
        4: ["estimation", "strategy", "quantity", "correction", "life", "expression", "distractor"],
        5: ["open", "probability", "correction", "strategy", "life", "expression", "distractor"],
        6: ["estimation", "case", "life", "expression", "open", "probability", "correction", "strategy", "distractor"]
      };
      const makers = {
        estimation: () => {
          const place = grade <= 3 ? 10 : grade <= 5 ? 100 : 1000;
          const a = rand(place * 2, place * (grade + 6));
          const b = rand(place, place * (grade + 3));
          const exact = a + b;
          const estimate = Math.round(exact / place) * place;
          return baseQuestion(point, {
            text: `估算合理性：${a} + ${b} 的结果最接近哪个数？`,
            answer: estimate,
            word: true,
            explanation: `估算时先看大约范围。${a} + ${b} = ${exact}，最接近的 ${place === 10 ? "整十" : place === 100 ? "整百" : "整千"}数是 ${estimate}。`,
            steps: [`先粗看：${a} 接近 ${Math.round(a / place) * place}。`, `${b} 接近 ${Math.round(b / place) * place}。`, `精确和 ${exact} 最接近 ${estimate}。`],
            templateType: "估算合理性"
          });
        },
        strategy: () => {
          const anchor = grade <= 2 ? 20 : grade <= 4 ? 100 : 1000;
          const a = anchor - rand(2, 9);
          const c = anchor - a;
          const b = rand(12, 48 + level * 8);
          return baseQuestion(point, {
            text: `策略选择：计算 ${a} + ${b} + ${c}，最适合先算哪一步？1 表示先算 ${a}+${c}，2 表示先算 ${a}+${b}，3 表示从左到右硬算。请选择序号。`,
            answer: 1,
            word: true,
            explanation: `${a} + ${c} 正好凑成 ${anchor}，先凑整更省力，所以选 1。`,
            steps: [`观察 ${a} 和 ${c} 能凑成 ${anchor}。`, `先算 ${a} + ${c} = ${anchor}。`, `再加 ${b}，方法更简便。`],
            templateType: "策略选择"
          });
        },
        quantity: () => {
          const items = grade <= 2
            ? [{ text: "一支铅笔的长度", options: ["18 米", "18 厘米", "18 千米"], answer: 2 }, { text: "一间教室门的高度", options: ["2 米", "2 厘米", "20 米"], answer: 1 }]
            : [{ text: "一间普通教室的面积", options: ["50 平方厘米", "50 平方米", "5000 平方米"], answer: 2 }, { text: "一瓶矿泉水大约重", options: ["500 克", "500 千克", "5 克"], answer: 1 }];
          const item = pick(items);
          return baseQuestion(point, {
            text: `量感判断：${item.text}最合理的是哪一个？1=${item.options[0]}，2=${item.options[1]}，3=${item.options[2]}。请选择序号。`,
            answer: item.answer,
            word: true,
            explanation: `量感题不急着算，先想真实生活大小。${item.options[item.answer - 1]}最合理。`,
            steps: [`先排除明显太大或太小的选项。`, `再和生活经验比较。`, `选择 ${item.answer}。`],
            templateType: "量感判断"
          });
        },
        correction: () => {
          const a = rand(24, 86 + grade * 10);
          const b = rand(17, 68);
          const correct = a + b;
          const wrong = correct - 10;
          return baseQuestion(point, {
            text: `找错改错：小朋友算 ${a} + ${b} = ${wrong}，这是错误的。正确答案是多少？`,
            answer: correct,
            word: true,
            explanation: `这类题先找错误，再改正。${a} + ${b} 的个位相加需要看清进位，正确结果是 ${correct}。`,
            steps: [`重新计算 ${a} + ${b}。`, `检查个位和十位。`, `正确答案是 ${correct}。`],
            templateType: "找错改错"
          });
        },
        open: () => {
          const target = grade <= 1 ? rand(8, 20) : grade <= 2 ? rand(12, 30) : rand(40, 160 + grade * 20);
          const example = rand(Math.max(1, Math.floor(target / 4)), Math.floor(target / 2));
          return baseQuestion(point, {
            text: `开放多答案：写出一个数，使它和 ${target - example} 相加等于 ${target}。可以填一个符合条件的数，例如是多少？`,
            answer: example,
            answerLabel: `例如 ${example}`,
            word: true,
            explanation: `开放题可能有多种表达方式，这里只要给出一个符合条件的例子。${example} + ${target - example} = ${target}。`,
            steps: [`先看目标和是 ${target}。`, `用 ${target} - ${target - example} 找到一个可行数。`, `例如可以填 ${example}。`],
            templateType: "开放多答案"
          });
        },
        life: () => {
          const priceA = rand(4, 18 + grade * 2);
          const priceB = rand(3, 16 + grade * 2);
          const countA = rand(1, 4);
          const countB = rand(1, 3);
          const total = priceA * countA + priceB * countB;
          return baseQuestion(point, {
            text: `生活阅读：看票据表，面包 ${priceA} 元/个买 ${countA} 个，牛奶 ${priceB} 元/盒买 ${countB} 盒。合计多少元？`,
            answer: total,
            word: true,
            explanation: `读票据表要先找单价和数量，再分别相乘后合计。`,
            steps: [`面包：${priceA} × ${countA} = ${priceA * countA} 元。`, `牛奶：${priceB} × ${countB} = ${priceB * countB} 元。`, `合计 ${total} 元。`],
            templateType: "生活阅读"
          });
        },
        pattern: () => {
          const start = rand(1, 12);
          const step = rand(2, 8);
          const sequence = [start, start + step, start + step * 2, start + step * 3];
          return baseQuestion(point, {
            text: `规律数列：${sequence.join("，")}，下一个数是多少？`,
            answer: start + step * 4,
            word: true,
            explanation: `相邻两个数每次都增加 ${step}，所以下一个数是 ${sequence[3]} + ${step} = ${start + step * 4}。`,
            steps: [`看相邻差：都是 ${step}。`, `继续加 ${step}。`, `下一个数是 ${start + step * 4}。`],
            templateType: "规律数列"
          });
        },
        case: () => {
          const seats = rand(4, 8);
          const people = seats * rand(3, 10) + rand(1, seats - 1);
          const answer = Math.ceil(people / seats);
          return baseQuestion(point, {
            text: `分类讨论：${people} 人坐车，每辆车最多坐 ${seats} 人。至少需要几辆车？`,
            answer,
            word: true,
            explanation: `有余数时要分类讨论：剩下的人也需要一辆车，所以要在商的基础上加 1。`,
            steps: [`${people} ÷ ${seats} = ${Math.floor(people / seats)} 余 ${people % seats}。`, `余下 ${people % seats} 人也要坐车。`, `至少需要 ${answer} 辆。`],
            templateType: "分类讨论"
          });
        },
        probability: () => {
          const red = rand(3, 8);
          const blue = rand(1, red - 1);
          return baseQuestion(point, {
            text: `可能性：袋子里有 ${red} 个红球、${blue} 个蓝球，任意摸 1 个，哪种颜色更可能摸到？红球填 1，蓝球填 2。`,
            answer: 1,
            word: true,
            explanation: `红球数量比蓝球多，所以摸到红球的可能性更大。`,
            steps: [`比较数量：红球 ${red} 个，蓝球 ${blue} 个。`, `数量多的颜色更可能摸到。`, `选择 1。`],
            templateType: "可能性"
          });
        },
        distractor: () => {
          if (grade <= 2) {
            const total = rand(16, 30);
            const used = rand(3, 12);
            const red = rand(2, Math.max(2, total - used - 1));
            return baseQuestion(point, {
              text: `干扰条件推理：一盒彩纸有 ${total} 张，用掉 ${used} 张，剩下的里面有 ${red} 张红色。要求还剩多少张，应该使用哪两个数字？输入 1 表示 ${total} 和 ${used}，输入 2 表示 ${total} 和 ${red}，输入 3 表示 ${used} 和 ${red}。`,
              answer: 1,
              word: true,
              explanation: `要求还剩多少张，要用总数减用掉的数量。红色张数只是剩下彩纸里的分类信息，是干扰条件。`,
              steps: [`先看问题：还剩多少张。`, `有用条件是总数 ${total} 和用掉 ${used}。`, `${red} 张红色是干扰条件，所以选择 1。`],
              templateType: "干扰条件推理"
            });
          }
          const total = rand(120, 360);
          const groups = rand(4, 8);
          const each = rand(8, 24);
          const label = rand(2, 9);
          const answer = total - groups * each;
          return baseQuestion(point, {
            text: `干扰条件推理：活动室有 ${total} 个奖品，发给 ${groups} 个小组，每组 ${each} 个，盒子上贴着 ${label} 号标签。现在还剩多少个奖品？`,
            answer,
            word: true,
            explanation: `标签号不是数量条件。先算发出 ${groups} × ${each} 个，再用总数减去发出数量。`,
            steps: [`发出：${groups} × ${each} = ${groups * each} 个。`, `标签 ${label} 号只是标记，不参加计算。`, `剩下：${total} - ${groups * each} = ${answer} 个。`],
            templateType: "干扰条件推理"
          });
        },
        expression: () => {
          if (grade <= 1) {
            const red = rand(2, 9);
            const blue = rand(2, 9);
            return baseQuestion(point, {
              text: `数学表达：盒子里有 ${red} 颗红星和 ${blue} 颗蓝星，求一共有多少颗。正确算式是哪一个？1=${red}+${blue}，2=${red}-${blue}，3=${blue}-${red}。请选择序号。`,
              answer: 1,
              word: true,
              explanation: `求一共有多少，要把两部分合起来，用加法，所以选 1。`,
              steps: [`红星 ${red} 颗。`, `蓝星 ${blue} 颗。`, `合起来用 ${red}+${blue}。`],
              templateType: "数学表达"
            });
          }
          const count = rand(2, 6);
          const price = rand(4, 18 + grade * 2);
          const extra = rand(2, 12);
          return baseQuestion(point, {
            text: `数学表达：买 ${count} 本练习本，每本 ${price} 元，又买 1 支 ${extra} 元的笔。正确算式是哪一个？1=${count}×${price}+${extra}，2=${count}+${price}×${extra}，3=${count}×(${price}+${extra})。请选择序号。`,
            answer: 1,
            word: true,
            explanation: `先用本数 × 单价算练习本的钱，再加笔的钱，正确算式是 ${count}×${price}+${extra}。`,
            steps: [`练习本：${count} × ${price}。`, `再加笔的钱 ${extra}。`, `选择 1。`],
            templateType: "数学表达"
          });
        }
      };
      const category = pick(categoryPools[grade] || categoryPools[6]);
      return makers[category]();
    }
    function makeDecimal(point, level) {
      const a = round1(rand(12, 98 + level * 20) / 10);
      const b = round1(rand(8, 60 + level * 12) / 10);
      if (point.id === "g5-decimal" && Math.random() > 0.58) {
        if (Math.random() > 0.5) {
          const multiplier = rand(2, 9);
          const answer = round1(a * multiplier);
          return baseQuestion(point, {
            text: `${a} × ${multiplier} = ?`,
            answer,
            explanation: `小数乘整数，可以先按整数乘法算，再看小数有几位。${a} 有 1 位小数，算完把小数点放回去，得到 ${formatAnswer(answer)}。`,
            steps: [`先把 ${a} 看成 ${Math.round(a * 10)} 来乘。`, `${Math.round(a * 10)} × ${multiplier} = ${Math.round(a * 10) * multiplier}。`, `原来有 1 位小数，所以答案是 ${formatAnswer(answer)}。`]
          });
        }
        const divisor = rand(2, 9);
        const quotient = round1(rand(12, 90 + level * 12) / 10);
        const dividend = round1(quotient * divisor);
        return baseQuestion(point, {
          text: `${dividend} ÷ ${divisor} = ?`,
          answer: quotient,
          explanation: `小数除以整数，先像整数除法一样分，最后把小数点对齐放回商里。因为 ${quotient} × ${divisor} = ${dividend}，所以答案是 ${formatAnswer(quotient)}。`,
          steps: [`想反向乘法：几乘 ${divisor} 等于 ${dividend}。`, `${quotient} × ${divisor} = ${dividend}。`, `所以 ${dividend} ÷ ${divisor} = ${formatAnswer(quotient)}。`]
        });
      }
      const op = Math.random() > 0.5 ? "+" : "-";
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      const answer = op === "+" ? round1(a + b) : round1(big - small);
      return baseQuestion(point, {
        text: op === "+" ? `${a} + ${b} = ?` : `${big} - ${small} = ?`,
        answer,
        explanation: `小数加减要把小数点对齐，再按整数方法算。算完小数点仍然对齐，所以答案是 ${formatAnswer(answer)}。`,
        steps: [`小数点对齐。`, `按整数加减法计算。`, `把小数点放回同样的位置，得到 ${formatAnswer(answer)}。`]
      });
    }
    function makeFraction(point, level) {
      if (point.id === "g6-fraction-percent" && Math.random() > 0.5) {
        const denominator = pick([4, 5, 8, 10, 20]);
        const numerator = rand(1, denominator - 1);
        const answer = round1(numerator / denominator * 100);
        return baseQuestion(point, {
          text: `${numerator}/${denominator} 等于百分之多少？`,
          answer,
          answerLabel: `${formatAnswer(answer)}%`,
          explanation: `把分数化成百分数，可以先算 ${numerator} ÷ ${denominator}，再乘 100。结果约是 ${formatAnswer(answer)}%。`,
          steps: [`先算 ${numerator} ÷ ${denominator}。`, `再把小数乘 100 变成百分数。`, `得到 ${formatAnswer(answer)}%。`]
        });
      }
      if (Math.random() > 0.45) {
        const denominator = pick([4, 5, 6, 8, 10, 12]);
        let a = rand(1, Math.floor(denominator / 2));
        let b = rand(1, denominator - a - 1);
        const simplified = simplifyFraction(a + b, denominator);
        const answer = (a + b) / denominator;
        return baseQuestion(point, {
          text: `${a}/${denominator} + ${b}/${denominator} = ?${simplified.terminating ? "（可填分数或小数）" : "（用最简分数表示）"}`,
          answer,
          answerLabel: simplified.label,
          acceptedAnswers: simplified.accepted,
          explanation: `同分母分数相加，分母不变，只把分子相加。${a} + ${b} = ${a + b}，得 ${a + b}/${denominator}${simplified.label !== simplified.raw ? `，化简后是 ${simplified.label}` : ""}。`,
          steps: [`看分母：两个分母都是 ${denominator}。`, `分母不变，分子相加：${a} + ${b} = ${a + b}。`, `结果是 ${a + b}/${denominator}${simplified.label !== simplified.raw ? `，约分成最简 ${simplified.label}` : ""}。`]
        });
      }
      const total = rand(24, 120 + level * 20);
      const denominator = pick([3, 4, 5, 6, 8]);
      const numerator = rand(1, denominator - 1);
      const base = Math.ceil(total / denominator) * denominator;
      const answer = base / denominator * numerator;
      return baseQuestion(point, {
        text: `${base} 的 ${numerator}/${denominator} 是多少？`,
        answer,
        explanation: `求一个数的几分之几，可以先平均分。先算 ${base} ÷ ${denominator} = ${base / denominator}，再乘 ${numerator}，得到 ${answer}。`,
        steps: [`先把 ${base} 平均分成 ${denominator} 份。`, `每份是 ${base / denominator}。`, `取 ${numerator} 份：${base / denominator} × ${numerator} = ${answer}。`]
      });
    }
    function makeUnit(point, level) {
      if (point.id === "g2-time-money") {
        if (Math.random() > 0.5) {
          const yuan = rand(2, 18);
          const jiao = rand(1, 9);
          return baseQuestion(point, {
            text: `${yuan} 元 ${jiao} 角 = ? 角`,
            answer: yuan * 10 + jiao,
            explanation: `1 元 = 10 角。先把 ${yuan} 元换成 ${yuan * 10} 角，再加 ${jiao} 角。`,
            steps: [`${yuan} 元 = ${yuan * 10} 角。`, `${yuan * 10} + ${jiao} = ${yuan * 10 + jiao} 角。`]
          });
        }
        const start = rand(7, 10);
        const minutes = pick([15, 20, 25, 30, 35, 45]);
        return baseQuestion(point, {
          text: `${start}:00 过 ${minutes} 分是几点几分？（填写分钟数）`,
          answer: minutes,
          answerLabel: `${start}:${String(minutes).padStart(2, "0")}`,
          explanation: `整点过几分，小时不变，分钟就是过了的 ${minutes} 分。完整时间是 ${start}:${String(minutes).padStart(2, "0")}。`,
          steps: [`从 ${start}:00 开始。`, `过 ${minutes} 分。`, `时间是 ${start}:${String(minutes).padStart(2, "0")}。`]
        });
      }
      const type = pick(point.grade >= 5 ? ["mcm", "kg", "time", "km", "area"] : ["mcm", "kg", "time"]);
      if (type === "km") {
        const km = rand(1, 8 + level);
        const m = rand(100, 900);
        return baseQuestion(point, {
          text: `${km} 千米 ${m} 米 = ? 米`,
          answer: km * 1000 + m,
          explanation: `1 千米 = 1000 米。先把 ${km} 千米换成 ${km * 1000} 米，再加 ${m} 米。`,
          steps: [`${km} 千米 = ${km * 1000} 米。`, `${km * 1000} + ${m} = ${km * 1000 + m} 米。`]
        });
      }
      if (type === "area") {
        const ha = rand(1, 9);
        return baseQuestion(point, {
          text: `${ha} 公顷 = ? 平方米`,
          answer: ha * 10000,
          explanation: `1 公顷 = 10000 平方米。${ha} 公顷就是 ${ha} × 10000 平方米。`,
          steps: [`记住 1 公顷 = 10000 平方米。`, `${ha} × 10000 = ${ha * 10000}。`]
        });
      }
      if (type === "mcm") {
        const m = rand(2, 9 + level);
        const cm = rand(5, 90);
        return baseQuestion(point, {
          text: `${m} 米 ${cm} 厘米 = ? 厘米`,
          answer: m * 100 + cm,
          explanation: `1 米 = 100 厘米。先把 ${m} 米换成 ${m * 100} 厘米，再加 ${cm} 厘米，得到 ${m * 100 + cm} 厘米。`,
          steps: [`记住 1 米 = 100 厘米。`, `${m} 米 = ${m * 100} 厘米。`, `${m * 100} + ${cm} = ${m * 100 + cm} 厘米。`]
        });
      }
      if (type === "kg") {
        const kg = rand(1, 6 + level);
        const g = rand(100, 900);
        return baseQuestion(point, {
          text: `${kg} 千克 ${g} 克 = ? 克`,
          answer: kg * 1000 + g,
          explanation: `1 千克 = 1000 克。先把 ${kg} 千克换成 ${kg * 1000} 克，再加 ${g} 克。`,
          steps: [`记住 1 千克 = 1000 克。`, `${kg} 千克 = ${kg * 1000} 克。`, `${kg * 1000} + ${g} = ${kg * 1000 + g} 克。`]
        });
      }
      const h = rand(1, 4 + level);
      const min = rand(5, 50);
      return baseQuestion(point, {
        text: `${h} 小时 ${min} 分 = ? 分`,
        answer: h * 60 + min,
        explanation: `1 小时 = 60 分。先把 ${h} 小时换成 ${h * 60} 分，再加 ${min} 分。`,
        steps: [`记住 1 小时 = 60 分。`, `${h} 小时 = ${h * 60} 分。`, `${h * 60} + ${min} = ${h * 60 + min} 分。`]
      });
    }
    function makePercent(point, level) {
      const variants = [
        () => {
          const price = rand(1, 6 + level * 2) * 20;
          const discount = pick([0.5, 0.6, 0.75, 0.8, 0.85, 0.9]);
          const answer = round1(price * discount);
          return baseQuestion(point, {
            text: `一本练习册 ${price} 元，打 ${discount * 10} 折后需要多少元？`,
            answer,
            word: true,
            explanation: `${discount * 10} 折就是原价的 ${discount}。用 ${price} × ${discount}，得到 ${formatAnswer(answer)} 元。`,
            steps: [`把折扣改成小数：${discount * 10} 折 = ${discount}。`, `用原价乘折扣：${price} × ${discount}。`, `结果是 ${formatAnswer(answer)} 元。`]
          });
        },
        () => {
          const total = rand(4, 18) * 20;
          const percent = pick([15, 20, 25, 30, 40, 50, 60]);
          const answer = round1(total * percent / 100);
          return baseQuestion(point, {
            text: `${total} 人中有 ${percent}% 参加数学社团，参加的人数是多少？`,
            answer,
            word: true,
            explanation: `求一个数的百分之几，用这个数乘百分数。${total} × ${percent}% = ${formatAnswer(answer)}。`,
            steps: [`把 ${percent}% 看成 ${percent}/100。`, `${total} × ${percent} ÷ 100 = ${formatAnswer(answer)}。`]
          });
        },
        () => {
          const oldPrice = rand(3, 13) * 20;
          const percent = pick([10, 15, 20, 25, 30]);
          const increase = round1(oldPrice * percent / 100);
          const answer = round1(oldPrice + increase);
          return baseQuestion(point, {
            text: `一件文具原价 ${oldPrice} 元，涨价 ${percent}% 后是多少元？`,
            answer,
            word: true,
            explanation: `涨价后是原价加上涨价部分。先求 ${oldPrice} 的 ${percent}% 是 ${formatAnswer(increase)}，再加回原价。`,
            steps: [`增加：${oldPrice} × ${percent}% = ${formatAnswer(increase)}。`, `现价：${oldPrice} + ${formatAnswer(increase)} = ${formatAnswer(answer)}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeRatio(point, level) {
      if (point.id === "g6-scale") {
        const variants = [
          () => {
          const scale = pick([1000, 2000, 5000, 10000]);
          const mapCm = rand(2, 9);
          const answer = round1(mapCm * scale / 100);
          return baseQuestion(point, {
            text: `比例尺 1:${scale} 的图上，距离是 ${mapCm} cm，实际距离是多少米？`,
            answer,
            word: true,
            explanation: `比例尺 1:${scale} 表示图上 1 cm 对应实际 ${scale} cm。先算厘米，再换成米。`,
            steps: [`实际厘米：${mapCm} × ${scale} = ${mapCm * scale} cm。`, `换成米：${mapCm * scale} ÷ 100 = ${formatAnswer(answer)} 米。`]
          });
          },
          () => {
            const scale = pick([1000, 2000, 5000, 10000]);
            // 先定整数图上距离，反推实际距离，保证换算不产生多余小数
            const mapCm = rand(2, 12);
            const actualM = mapCm * scale / 100;
            const answer = mapCm;
            return baseQuestion(point, {
              text: `实际距离 ${actualM} 米，比例尺 1:${scale}，图上距离是多少厘米？`,
              answer,
              word: true,
              explanation: `先把实际距离换成厘米，再除以比例尺中的 ${scale}。${actualM} 米 = ${actualM * 100} cm，${actualM * 100} ÷ ${scale} = ${mapCm} cm。`,
              steps: [`${actualM} 米 = ${actualM * 100} cm。`, `图上距离：${actualM * 100} ÷ ${scale} = ${mapCm} cm。`]
            });
          },
          () => {
            const scale = pick([5000, 10000, 20000]);
            // 直接取整数图上距离，避免反推产生小数
            const mapCm = rand(2, 8);
            const extraCm = pick([1, 2, 3]);
            const totalCm = mapCm + extraCm;
            const answer = totalCm * scale / 100;
            return baseQuestion(point, {
              text: `比例尺 1:${scale} 的图上，原来 ${mapCm} cm，又向前画 ${extraCm} cm，新的实际距离是多少米？`,
              answer,
              word: true,
              explanation: `先求新的图上距离，再按比例尺换算实际距离。图上距离是 ${mapCm} + ${extraCm} = ${totalCm} cm，实际 ${totalCm} × ${scale} ÷ 100 = ${answer} 米。`,
              steps: [`图上距离合计 ${totalCm} cm。`, `实际厘米：${totalCm} × ${scale} = ${totalCm * scale} cm。`, `换成米：${totalCm * scale} ÷ 100 = ${answer} 米。`],
              templateType: "比例尺两步"
            });
          }
        ];
        return pick(variants)();
      }
      const variants = [
        () => {
          const a = rand(2, 5 + level);
          const b = rand(3, 7 + level);
          const unit = rand(4, 12);
          const total = (a + b) * unit;
          const answer = a * unit;
          return baseQuestion(point, {
            text: `把 ${total} 个贴纸按 ${a}:${b} 分给甲和乙，甲分到多少个？`,
            answer,
            word: true,
            explanation: `比例 ${a}:${b} 一共有 ${a + b} 份。先算每份 ${total} ÷ ${a + b} = ${unit}，甲有 ${a} 份，所以 ${unit} × ${a} = ${answer}。`,
            steps: [`总份数：${a} + ${b} = ${a + b}。`, `每份：${total} ÷ ${a + b} = ${unit}。`, `甲有 ${a} 份：${unit} × ${a} = ${answer}。`]
          });
        },
        () => {
          const each = rand(3, 9);
          const known = rand(4, 8);
          const target = rand(10, 18);
          const answer = each * target;
          return baseQuestion(point, {
            text: `${known} 个零件需要 ${known * each} 分钟，照这样做，${target} 个零件需要多少分钟？`,
            answer,
            word: true,
            explanation: `这是正比例关系。先求每个零件需要 ${each} 分钟，再乘 ${target} 个。`,
            steps: [`每个零件：${known * each} ÷ ${known} = ${each} 分钟。`, `${target} 个：${each} × ${target} = ${answer} 分钟。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeStatistics(point, level) {
      if (point.id === "g3-statistics") {
        const a = rand(8, 24);
        const b = rand(6, 22);
        const c = rand(5, 20);
        if (Math.random() > 0.5) {
          return baseQuestion(point, {
            text: `三组同学收集卡片：一组 ${a} 张，二组 ${b} 张，三组 ${c} 张。一共收集多少张？`,
            answer: a + b + c,
            word: true,
            explanation: `读统计表时先找到每组数量，再求合计。${a} + ${b} + ${c} = ${a + b + c}。`,
            steps: [`一组 ${a} 张，二组 ${b} 张，三组 ${c} 张。`, `求总数用加法。`, `总数是 ${a + b + c} 张。`]
          });
        }
        const max = Math.max(a, b, c);
        const min = Math.min(a, b, c);
        return baseQuestion(point, {
          text: `三组卡片数分别是 ${a}、${b}、${c} 张，最多的一组比最少的一组多多少张？`,
          answer: max - min,
          word: true,
          explanation: `比较最多和最少，先找最大数 ${max}，再找最小数 ${min}，用减法求差。`,
          steps: [`最大数是 ${max}。`, `最小数是 ${min}。`, `${max} - ${min} = ${max - min}。`]
        });
      }
      const nums = [
        rand(8, 24 + level * 4),
        rand(8, 24 + level * 4),
        rand(8, 24 + level * 4),
        rand(8, 24 + level * 4)
      ];
      if (Math.random() > 0.45) {
        const sum = nums.reduce((acc, item) => acc + item, 0);
        const answer = round1(sum / nums.length);
        return baseQuestion(point, {
          text: `四天阅读页数分别是 ${nums.join("、")} 页，平均每天读多少页？`,
          answer,
          word: true,
          explanation: `平均数 = 总数 ÷ 份数。先把四天页数加起来，再除以 4。`,
          steps: [`总页数：${nums.join(" + ")} = ${sum}。`, `平均数：${sum} ÷ 4 = ${formatAnswer(answer)}。`]
        });
      }
      const avg = rand(12, 28);
      const total = avg * 5;
      const known = [rand(8, 24), rand(8, 24), rand(8, 24), rand(8, 24)];
      let last = total - known.reduce((acc, item) => acc + item, 0);
      if (last <= 0 || last > 60) {
        known[0] = avg - 2;
        known[1] = avg + 1;
        known[2] = avg + 3;
        known[3] = avg - 1;
        last = total - known.reduce((acc, item) => acc + item, 0);
      }
      return baseQuestion(point, {
        text: `5 次口算平均每次 ${avg} 分，前 4 次分别是 ${known.join("、")} 分，第 5 次要多少分？`,
        answer: last,
        word: true,
        explanation: `平均数反推总数：平均 ${avg} 分、5 次，总分是 ${total}。再减去前 4 次。`,
        steps: [`总分：${avg} × 5 = ${total}。`, `前 4 次合计：${known.reduce((acc, item) => acc + item, 0)}。`, `第 5 次：${total} - ${known.reduce((acc, item) => acc + item, 0)} = ${last}。`]
      });
    }
    function makeEquation(point, level) {
      const variants = [
        () => {
          const x = rand(6, 48 + level * 10);
          const add = rand(8, 70);
          return baseQuestion(point, {
            text: `x + ${add} = ${x + add}，x = ?`,
            answer: x,
            explanation: `等式两边同时减去 ${add}，就能留下 x。${x + add} - ${add} = ${x}。`,
            steps: [`原式：x + ${add} = ${x + add}。`, `两边减 ${add}。`, `x = ${x}。`]
          });
        },
        () => {
          const x = rand(4, 28 + level * 8);
          const factor = rand(2, 9);
          return baseQuestion(point, {
            text: `${factor}x = ${factor * x}，x = ?`,
            answer: x,
            explanation: `${factor}x 表示 ${factor} × x。等式两边同时除以 ${factor}。`,
            steps: [`${factor}x = ${factor * x}。`, `两边除以 ${factor}。`, `x = ${x}。`]
          });
        },
        () => {
          const x = rand(5, 36);
          const factor = rand(2, 8);
          const add = rand(6, 30);
          const total = factor * x + add;
          return baseQuestion(point, {
            text: `${factor}x + ${add} = ${total}，x = ?`,
            answer: x,
            explanation: `先把加上的 ${add} 去掉，再除以 ${factor}。`,
            steps: [`两边减 ${add}：${total} - ${add} = ${factor * x}。`, `再除以 ${factor}：${factor * x} ÷ ${factor} = ${x}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeWord(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const formulaQuestion = (data) => baseQuestion(point, {
        ...data,
        answerType: "formula",
        answerLabel: data.formulaAnswer,
        word: true,
        templateType: data.templateType || "列式应用"
      });
      // 情境词库：每个情境把"事物 + 量词 + 容器 + 容器量词 + 动词"绑定在一起，
      // 保证换情境时量词、动词依然通顺（避免"3 块书""每书架"这类语病）。
      // item=事物, mw=事物量词, holder=容器, hmw=容器量词, put=放入动词, take=取出动词。
      const SCENARIOS = [
        { item: "贴纸", mw: "张", holder: "盒子", hmw: "个", put: "放进", take: "用掉" },
        { item: "故事书", mw: "本", holder: "书架", hmw: "个", put: "放上", take: "借走" },
        { item: "饼干", mw: "块", holder: "袋子", hmw: "个", put: "装进", take: "吃掉" },
        { item: "苹果", mw: "个", holder: "果篮", hmw: "个", put: "放入", take: "拿走" },
        { item: "彩笔", mw: "支", holder: "笔筒", hmw: "个", put: "插入", take: "取走" },
        { item: "邮票", mw: "枚", holder: "集邮册", hmw: "本", put: "贴上", take: "送出" },
        { item: "糖果", mw: "颗", holder: "糖罐", hmw: "个", put: "放进", take: "分掉" },
        { item: "金鱼", mw: "条", holder: "鱼缸", hmw: "个", put: "放养", take: "捞走" }
      ];
      const scene = () => pick(SCENARIOS);
      const lowAddSub = [
        () => {
          const total = point.id === "g1-simple-word" ? rand(8, 20) : rand(28, 96);
          const used = rand(2, Math.floor(total / 2));
          const s = scene();
          return baseQuestion(point, {
            text: `${s.holder}里原来有 ${total} ${s.mw}${s.item}，${s.take} ${used} ${s.mw}，还剩多少${s.mw}？`,
            answer: total - used,
            word: true,
            explanation: `题目问"还剩"，说明要从原来的数量里拿走一部分，用减法。${total} - ${used} = ${total - used}。`,
            steps: [`原来有 ${total} ${s.mw}。`, `${s.take} ${used} ${s.mw}，要做减法。`, `${total} - ${used} = ${total - used} ${s.mw}。`]
          });
        },
        () => {
          const a = point.id === "g1-simple-word" ? rand(3, 9) : rand(12, 45);
          const b = point.id === "g1-simple-word" ? rand(2, 20 - a) : rand(8, 45);
          const s = scene();
          return baseQuestion(point, {
            text: `${s.holder}里有 ${a} ${s.mw}${s.item}，又${s.put} ${b} ${s.mw}。一共有多少${s.mw}？`,
            answer: a + b,
            word: true,
            explanation: `题目问"一共"，就是把两部分合起来，用加法。${a} + ${b} = ${a + b}。`,
            steps: [`先找到两部分：${a} ${s.mw}和 ${b} ${s.mw}。`, `求一共用加法。`, `${a} + ${b} = ${a + b} ${s.mw}。`]
          });
        },
        () => {
          const a = point.id === "g1-simple-word" ? rand(4, 12) : rand(16, 50);
          const diff = point.id === "g1-simple-word" ? rand(2, 8) : rand(6, 22);
          const s = scene();
          const who = pick([["小猫", "小兔"], ["哥哥", "弟弟"], ["红队", "蓝队"], ["小明", "小红"]]);
          return baseQuestion(point, {
            text: `${who[0]}有 ${a + diff} ${s.mw}${s.item}，${who[1]}有 ${a} ${s.mw}。${who[0]}比${who[1]}多多少${s.mw}？`,
            answer: diff,
            word: true,
            explanation: `问"多多少"就是比较两个数的差。用${who[0]}的 ${a + diff} 减${who[1]}的 ${a}。`,
            steps: [`${who[0]} ${a + diff} ${s.mw}。`, `${who[1]} ${a} ${s.mw}。`, `${a + diff} - ${a} = ${diff} ${s.mw}。`]
          });
        },
        () => {
          const red = point.id === "g1-simple-word" ? rand(3, 10) : rand(12, 38);
          const blue = point.id === "g1-simple-word" ? rand(2, 9) : rand(8, 32);
          const give = rand(1, Math.max(1, Math.floor((red + blue) / 3)));
          return baseQuestion(point, {
            text: `手工盒里有 ${red} 张红纸和 ${blue} 张蓝纸，送给同学 ${give} 张后，还剩多少张纸？`,
            answer: red + blue - give,
            word: true,
            explanation: `先求红纸和蓝纸一共有多少，再减去送出的数量。`,
            steps: [`先合起来：${red} + ${blue} = ${red + blue} 张。`, `再减去送出的 ${give} 张。`, `${red + blue} - ${give} = ${red + blue - give} 张。`],
            templateType: "两步应用"
          });
        }
      ];
      const equalGroup = [
        () => {
          const each = rand(3, 9 + level);
          const boxes = rand(2, 8);
          const s = scene();
          return baseQuestion(point, {
            text: `每${s.hmw}${s.holder}有 ${each} ${s.mw}${s.item}，老师准备了 ${boxes} ${s.hmw}${s.holder}。一共有多少${s.mw}${s.item}？`,
            answer: each * boxes,
            word: true,
            explanation: `每${s.hmw}${s.holder}数量一样，求一共有多少，用乘法。${each} × ${boxes} = ${each * boxes}。`,
            steps: [`每${s.hmw}${s.holder} ${each} ${s.mw}。`, `一共有 ${boxes} ${s.hmw}${s.holder}。`, `用乘法：${each} × ${boxes} = ${each * boxes}。`]
          });
        },
        () => {
          const each = rand(3, 9);
          const groups = rand(3, 9);
          return baseQuestion(point, {
            text: `${each * groups} 个苹果平均装进 ${groups} 个袋子，每袋装多少个？`,
            answer: each,
            word: true,
            explanation: `题目说"平均装进"，每袋一样多，用除法。${each * groups} ÷ ${groups} = ${each}。`,
            steps: [`总共有 ${each * groups} 个。`, `平均分成 ${groups} 袋。`, `${each * groups} ÷ ${groups} = ${each} 个。`]
          });
        },
        () => {
          const each = rand(2, 8);
          const groups = rand(3, 9);
          return baseQuestion(point, {
            text: `${each * groups} 个扣子，每 ${each} 个穿成一串，可以穿成几串？`,
            answer: groups,
            word: true,
            explanation: `每 ${each} 个一串，求有几串，用除法。${each * groups} ÷ ${each} = ${groups}。`,
            steps: [`总数是 ${each * groups} 个。`, `每串 ${each} 个。`, `${each * groups} ÷ ${each} = ${groups} 串。`]
          });
        },
        () => {
          const each = rand(2, 8);
          const boxes = rand(3, 8);
          const extra = rand(2, 16);
          return baseQuestion(point, {
            text: `${boxes} 盒饼干，每盒 ${each} 块，又拿来 ${extra} 块散装饼干。一共有多少块？`,
            answer: boxes * each + extra,
            word: true,
            explanation: `先求盒装饼干有多少块，再加上散装的数量。`,
            steps: [`盒装：${boxes} × ${each} = ${boxes * each} 块。`, `加上散装：${boxes * each} + ${extra} = ${boxes * each + extra} 块。`],
            templateType: "两步应用"
          });
        }
      ];
      const formulaWord = [
        () => {
          const a = grade <= 2 ? rand(8, 36) : rand(28, 96);
          const b = grade <= 2 ? rand(5, 28) : rand(16, 85);
          const answer = a + b;
          return formulaQuestion({
            text: `书架上有 ${a} 本故事书，又放上 ${b} 本。一共有多少本？请列出算式并写出答案。`,
            answer,
            formulaAnswer: `${a}+${b}=${answer}`,
            acceptedFormulas: [`${a}+${b}=${answer}`, `${b}+${a}=${answer}`],
            explanation: `求一共有多少，是把两部分合起来。算式：${a} + ${b} = ${answer}。`,
            steps: [`找到两部分：${a} 本和 ${b} 本。`, `列式：${a} + ${b} = ${answer}。`, `答：一共有 ${answer} 本。`]
          });
        },
        () => {
          const total = grade <= 2 ? rand(30, 96) : rand(120, 520);
          const used = grade <= 2 ? rand(8, Math.floor(total / 2)) : rand(35, Math.floor(total / 2));
          const answer = total - used;
          return formulaQuestion({
            text: `活动准备了 ${total} 张卡片，已经用掉 ${used} 张。还剩多少张？请列出算式并写出答案。`,
            answer,
            formulaAnswer: `${total}-${used}=${answer}`,
            acceptedFormulas: [`${total}-${used}=${answer}`],
            explanation: `求还剩多少，要从总数里去掉已经用掉的数量。算式：${total} - ${used} = ${answer}。`,
            steps: [`总数是 ${total} 张。`, `用掉 ${used} 张。`, `列式：${total} - ${used} = ${answer}。`]
          });
        },
        () => {
          const each = rand(3, grade <= 2 ? 9 : 18);
          const groups = rand(3, grade <= 2 ? 9 : 14);
          const answer = each * groups;
          return formulaQuestion({
            text: `每盒有 ${each} 支铅笔，老师准备了 ${groups} 盒。一共有多少支铅笔？请列出算式并写出答案。`,
            answer,
            formulaAnswer: `${each}×${groups}=${answer}`,
            acceptedFormulas: [`${each}×${groups}=${answer}`, `${groups}×${each}=${answer}`, `${each}*${groups}=${answer}`, `${groups}*${each}=${answer}`],
            explanation: `每盒数量相同，求几个相同数量的和，用乘法。算式：${each} × ${groups} = ${answer}。`,
            steps: [`每盒 ${each} 支。`, `一共有 ${groups} 盒。`, `列式：${each} × ${groups} = ${answer}。`]
          });
        },
        () => {
          const each = rand(4, grade <= 2 ? 9 : 18);
          const groups = rand(3, grade <= 2 ? 8 : 16);
          const total = each * groups;
          return formulaQuestion({
            text: `${total} 个扣子平均装进 ${groups} 个袋子，每袋装多少个？请列出算式并写出答案。`,
            answer: each,
            formulaAnswer: `${total}÷${groups}=${each}`,
            acceptedFormulas: [`${total}÷${groups}=${each}`, `${total}/${groups}=${each}`],
            explanation: `平均分成同样多的 ${groups} 袋，用除法。算式：${total} ÷ ${groups} = ${each}。`,
            steps: [`总数是 ${total} 个。`, `平均分成 ${groups} 袋。`, `列式：${total} ÷ ${groups} = ${each}。`]
          });
        },
        () => {
          const rows = rand(3, 9);
          const each = rand(8, 24);
          const given = rand(5, 30);
          const answer = rows * each - given;
          return formulaQuestion({
            text: `礼堂摆了 ${rows} 排椅子，每排 ${each} 把，已经坐了 ${given} 人。还空着多少把椅子？请列出综合算式并写出答案。`,
            answer,
            formulaAnswer: `${rows}×${each}-${given}=${answer}`,
            acceptedFormulas: [`${rows}×${each}-${given}=${answer}`, `${rows}*${each}-${given}=${answer}`],
            explanation: `先求椅子总数，再减去已经坐的人数。算式：${rows} × ${each} - ${given} = ${answer}。`,
            steps: [`总椅子数：${rows} × ${each} = ${rows * each}。`, `还空着：${rows * each} - ${given} = ${answer}。`, `综合算式：${rows} × ${each} - ${given} = ${answer}。`],
            templateType: "列综合算式"
          });
        },
        () => {
          const price = rand(60, 240);
          const discount = pick([0.7, 0.8, 0.9]);
          const fee = rand(3, 12);
          const discounted = round1(price * discount);
          const answer = round1(discounted + fee);
          return formulaQuestion({
            text: `一件文具套装原价 ${price} 元，现在打 ${discount * 10} 折，另收包装费 ${fee} 元。实际要付多少元？请列出算式并写出答案。`,
            answer,
            formulaAnswer: `${price}×${discount}+${fee}=${formatAnswer(answer)}`,
            acceptedFormulas: [`${price}×${discount}+${fee}=${formatAnswer(answer)}`, `${price}*${discount}+${fee}=${formatAnswer(answer)}`],
            explanation: `先算折后价，再加包装费。算式：${price} × ${discount} + ${fee} = ${formatAnswer(answer)}。`,
            steps: [`折后价：${price} × ${discount} = ${formatAnswer(discounted)}。`, `实际支付：${formatAnswer(discounted)} + ${fee} = ${formatAnswer(answer)}。`],
            templateType: "列式应用"
          });
        }
      ];
      const distractorWord = [
        () => {
          const eaten = grade <= 2 ? rand(8, 26) : rand(18, 48);
          const left = grade <= 2 ? rand(6, 24) : rand(9, 36);
          const carp = rand(1, Math.max(1, Math.min(left - 1, 8)));
          const answer = eaten + left;
          return baseQuestion(point, {
            text: `小猫们吃了 ${eaten} 条小鱼，还剩 ${left} 条鱼，其中有 ${carp} 条是鲤鱼。原来有多少条鱼？`,
            answer,
            word: true,
            explanation: `要求原来有多少，只要把吃掉的和还剩的合起来；"其中 ${carp} 条是鲤鱼"只是在说明剩下鱼的种类，不用再单独计算。`,
            steps: [`找真正有用的数量：吃了 ${eaten} 条，还剩 ${left} 条。`, `鲤鱼 ${carp} 条已经包含在剩下的 ${left} 条里，不用再加一次。`, `${eaten} + ${left} = ${answer} 条。`],
            templateType: "干扰条件应用"
          });
        },
        () => {
          const total = grade <= 2 ? rand(60, 96) : rand(90, 180);
          const classCount = rand(3, grade <= 2 ? 5 : 6);
          const each = rand(5, Math.max(5, Math.floor((total - 12) / classCount)));
          const answer = total - classCount * each;
          const display = rand(1, Math.max(1, Math.min(answer, 12)));
          return baseQuestion(point, {
            text: `老师准备了 ${total} 张贴纸，发给 ${classCount} 个小组，每组 ${each} 张。剩下的贴纸里有 ${display} 张星星贴纸。还剩多少张贴纸？`,
            answer,
            word: true,
            explanation: `先求发出多少张，再用总数减去发出的数量。"星星贴纸"只是剩下贴纸的一种，不影响还剩总数。`,
            steps: [`发出：${classCount} × ${each} = ${classCount * each} 张。`, `剩下：${total} - ${classCount * each} = ${answer} 张。`, `${display} 张星星贴纸已经在剩下的 ${answer} 张里面。`],
            templateType: "干扰条件应用"
          });
        }
      ];
      const twoStep = [
        () => {
          const total = rand(60, 160 + level * 40);
          const used = rand(12, 40 + level * 8);
          const add = rand(10, 35 + level * 6);
          return baseQuestion(point, {
            text: `图书角原有 ${total} 本书，借走 ${used} 本，又新买 ${add} 本。现在有多少本？`,
            answer: total - used + add,
            word: true,
            explanation: `先处理"借走"，用减法；再处理"新买"，用加法。${total} - ${used} + ${add} = ${total - used + add}。`,
            steps: [`借走后：${total} - ${used} = ${total - used}。`, `又新买：${total - used} + ${add} = ${total - used + add}。`]
          });
        },
        () => {
          const rows = rand(3, 8 + level);
          const each = rand(4, 12 + level);
          const given = rand(5, 20);
          const answer = rows * each - given;
          return baseQuestion(point, {
            text: `操场上摆了 ${rows} 排椅子，每排 ${each} 把，已经坐了 ${given} 人。还空着多少把椅子？`,
            answer,
            word: true,
            explanation: `先求椅子总数，再减去已经坐的人数。${rows} × ${each} - ${given} = ${answer}。`,
            steps: [`先求总椅子数：${rows} × ${each} = ${rows * each}。`, `再减去已坐的 ${given} 人。`, `${rows * each} - ${given} = ${answer} 把。`]
          });
        },
        () => {
          const price = rand(5, 18);
          const count = rand(3, 8);
          const extra = rand(4, 20);
          return baseQuestion(point, {
            text: `每盒彩泥 ${price} 元，买 ${count} 盒后还剩 ${extra} 元。原来带了多少元？`,
            answer: price * count + extra,
            word: true,
            explanation: `先求买彩泥花了多少钱，再加上剩下的钱。${price} × ${count} + ${extra} = ${price * count + extra}。`,
            steps: [`花费：${price} × ${count} = ${price * count} 元。`, `原来钱数：${price * count} + ${extra} = ${price * count + extra} 元。`]
          });
        },
        () => {
          const days = rand(3, 6);
          const daily = rand(8, 24);
          const extra = rand(5, 30);
          return baseQuestion(point, {
            text: `小明计划 ${days} 天每天读 ${daily} 页，后来又多读了 ${extra} 页。一共读了多少页？`,
            answer: days * daily + extra,
            word: true,
            explanation: `先求按计划读了多少页，再加上多读的页数。`,
            steps: [`计划页数：${daily} × ${days} = ${daily * days} 页。`, `再加多读：${daily * days} + ${extra} = ${daily * days + extra} 页。`],
            templateType: "两步应用"
          });
        },
        () => {
          const total = rand(80, 240 + level * 30);
          const each = rand(8, 24);
          const days = rand(2, Math.max(3, Math.floor(total / each) - 1));
          const answer = total - each * days;
          return baseQuestion(point, {
            text: `练习册共有 ${total} 道题，已经做了 ${days} 天，每天做 ${each} 道。还剩多少道？`,
            answer,
            word: true,
            explanation: `先求已经做了多少道，再用总题数减去已做题数。`,
            steps: [`已做：${each} × ${days} = ${each * days} 道。`, `剩下：${total} - ${each * days} = ${answer} 道。`],
            templateType: "两步应用"
          });
        }
      ];
      const multiReasoningWord = [
        () => {
          const price = rand(42, 96);
          const threshold = 40;
          const discount = pick([6, 8, 10, 12]);
          const fee = rand(4, 9);
          const futureCoupon = rand(3, 8);
          const answer = price - discount + fee;
          return baseQuestion(point, {
            text: `爸爸在网上买了一个原价 ${price} 元的书包，店铺活动满 ${threshold} 减 ${discount} 元，另需配送费 ${fee} 元。页面还提示好评后返 ${futureCoupon} 元券，本次不能用。爸爸一共需要支付多少元？`,
            answer,
            word: true,
            explanation: `先判断 ${price} 元已经满 ${threshold} 元，可以减 ${discount} 元；配送费要再加上，返券是以后才能用的干扰条件。`,
            steps: [`商品优惠后：${price} - ${discount} = ${price - discount} 元。`, `加上配送费：${price - discount} + ${fee} = ${answer} 元。`, `${futureCoupon} 元返券本次不能用，不参与计算。`],
            templateType: "多步干扰应用"
          });
        },
        () => {
          const boxes = rand(4, 9);
          const each = rand(12, 24);
          const groups = rand(3, 6);
          const groupEach = rand(6, Math.floor((boxes * each - 10) / groups));
          const reserve = rand(3, Math.max(3, boxes * each - groups * groupEach - 5));
          const answer = boxes * each - groups * groupEach - reserve;
          const red = rand(1, Math.max(1, Math.min(answer, 12)));
          return baseQuestion(point, {
            text: `活动室有 ${boxes} 盒奖品，每盒 ${each} 个。先发给 ${groups} 个班，每班 ${groupEach} 个，又留下 ${reserve} 个备用。其中有 ${red} 个是红色奖品。现在还可以发多少个奖品？`,
            answer,
            word: true,
            explanation: `先求奖品总数，再依次减去已经发出的和备用的。"红色奖品"只是奖品颜色，不是额外数量。`,
            steps: [`总数：${boxes} × ${each} = ${boxes * each} 个。`, `已发：${groups} × ${groupEach} = ${groups * groupEach} 个。`, `还可发：${boxes * each} - ${groups * groupEach} - ${reserve} = ${answer} 个。`],
            templateType: "多步干扰应用"
          });
        },
        () => {
          const each = rand(6, 18);
          const days = rand(3, 7);
          const left = rand(12, 48);
          const wrong = rand(2, 9);
          const answer = each * days + left;
          return baseQuestion(point, {
            text: `一套口算题每天做 ${each} 道，已经做了 ${days} 天，还剩 ${left} 道没做，其中有 ${wrong} 道是昨天做错后重做的。原来这套题一共有多少道？`,
            answer,
            word: true,
            explanation: `要求原来一共有多少，要把已经做的和还没做的合起来；重做题只是说明剩下题里的情况，不能再额外加一次。`,
            steps: [`已经做：${each} × ${days} = ${each * days} 道。`, `原来总数：${each * days} + ${left} = ${answer} 道。`, `${wrong} 道重做题已经包含在还剩的 ${left} 道里。`],
            templateType: "反向多步应用"
          });
        }
      ];
      const upperWord = [
        () => {
          const speed = rand(45, 90);
          const hours = rand(2, 5);
          const rest = rand(12, 45);
          const answer = speed * hours + rest;
          return baseQuestion(point, {
            text: `校车每小时行 ${speed} 千米，行了 ${hours} 小时后又行了 ${rest} 千米，一共行了多少千米？`,
            answer,
            word: true,
            explanation: `先用速度乘时间求前面行的路程，再加上后来又行的路程。${speed} × ${hours} + ${rest} = ${answer}。`,
            steps: [`先求前 ${hours} 小时行了多少：${speed} × ${hours} = ${speed * hours}。`, `再加上后来行的 ${rest} 千米。`, `${speed * hours} + ${rest} = ${answer} 千米。`]
          });
        },
        () => {
          const price = rand(18, 96);
          const count = rand(3, 9);
          const pay = price * count + rand(5, 30);
          const answer = pay - price * count;
          return baseQuestion(point, {
            text: `每盒彩笔 ${price} 元，买 ${count} 盒，付了 ${pay} 元，应找回多少元？`,
            answer,
            word: true,
            explanation: `先求一共花了多少钱，再用付款金额减去花费。${pay} - ${price} × ${count} = ${answer}。`,
            steps: [`先求花费：${price} × ${count} = ${price * count} 元。`, `再求找回：${pay} - ${price * count} = ${answer} 元。`]
          });
        },
        () => {
          const known = rand(3, 8);
          const each = rand(12, 36);
          const target = known + rand(3, 8);
          const answer = each * target;
          return baseQuestion(point, {
            text: `${known} 箱矿泉水有 ${known * each} 瓶，照这样装，${target} 箱有多少瓶？`,
            answer,
            word: true,
            explanation: `这是归一问题。先求每箱多少瓶，再求 ${target} 箱。`,
            steps: [`每箱：${known * each} ÷ ${known} = ${each} 瓶。`, `${target} 箱：${each} × ${target} = ${answer} 瓶。`]
          });
        },
        () => {
          const days = rand(3, 7);
          const done = rand(20, 60);
          const completed = days * done;
          const total = rand(completed + 20, completed + 220);
          const answer = total - done * days;
          return baseQuestion(point, {
            text: `一本练习册有 ${total} 道题，已经连续 ${days} 天每天做 ${done} 道，还剩多少道？`,
            answer,
            word: true,
            explanation: `先求已经做了多少道，再用总数减去已做数量。`,
            steps: [`已做：${done} × ${days} = ${done * days} 道。`, `剩下：${total} - ${done * days} = ${answer} 道。`]
          });
        },
        () => {
          const first = rand(35, 90);
          const second = first + rand(12, 45);
          const times = rand(2, 5);
          const answer = (first + second) * times;
          return baseQuestion(point, {
            text: `甲、乙两个小组一小时分别整理 ${first} 本和 ${second} 本图书，合作 ${times} 小时能整理多少本？`,
            answer,
            word: true,
            explanation: `合作问题先求一小时合做多少，再乘合作时间。`,
            steps: [`一小时合做：${first} + ${second} = ${first + second} 本。`, `${times} 小时：${first + second} × ${times} = ${answer} 本。`],
            templateType: "合作问题"
          });
        },
        () => {
          const unit = rand(12, 36);
          const known = rand(3, 7);
          const target = known + rand(2, 6);
          const answer = unit * (target - known);
          return baseQuestion(point, {
            text: `${known} 箱牛奶有 ${unit * known} 盒，照这样装，增加到 ${target} 箱还要再准备多少盒？`,
            answer,
            word: true,
            explanation: `先求每箱多少盒，再求多出来的箱数需要多少盒。`,
            steps: [`每箱：${unit * known} ÷ ${known} = ${unit} 盒。`, `多出的箱数：${target} - ${known} = ${target - known} 箱。`, `还要：${unit} × ${target - known} = ${answer} 盒。`],
            templateType: "归一变式"
          });
        }
      ];
      const upperDistractorWord = [
        () => {
          const price = rand(12, 38) * 10;
          const discountRate = pick([0.7, 0.8, 0.9]);
          const coupon = rand(10, 35);
          const packFee = rand(2, 8);
          const giftValue = rand(8, 30);
          const discounted = round1(price * discountRate);
          const answer = round1(discounted - coupon + packFee);
          return baseQuestion(point, {
            text: `一件外套原价 ${price} 元，现在打 ${discountRate * 10} 折，再用 ${coupon} 元优惠券，包装费 ${packFee} 元。商家还送价值 ${giftValue} 元的小礼物。实际要支付多少元？`,
            answer,
            word: true,
            explanation: `先求折后价，再减优惠券，最后加包装费。赠品价值不需要付款，是干扰条件。`,
            steps: [`折后价：${price} × ${discountRate} = ${formatAnswer(discounted)} 元。`, `用券后：${formatAnswer(discounted)} - ${coupon} = ${formatAnswer(round1(discounted - coupon))} 元。`, `加包装费：${formatAnswer(round1(discounted - coupon))} + ${packFee} = ${formatAnswer(answer)} 元。`],
            templateType: "多步干扰应用"
          });
        },
        () => {
          const known = rand(3, 7);
          const each = rand(18, 42);
          const target = known + rand(4, 9);
          const stock = rand(12, Math.max(12, each * 2));
          const display = rand(2, 8);
          const answer = each * target - stock;
          return baseQuestion(point, {
            text: `${known} 箱矿泉水共有 ${known * each} 瓶。运动会需要准备 ${target} 箱同样的水，仓库已有 ${stock} 瓶，展台上另摆着 ${display} 瓶样品不发放。还要再买多少瓶？`,
            answer,
            word: true,
            explanation: `先用已知箱数求每箱多少瓶，再求目标总瓶数，最后减去仓库已有的瓶数；样品不发放，不能算进库存。`,
            steps: [`每箱：${known * each} ÷ ${known} = ${each} 瓶。`, `需要：${each} × ${target} = ${each * target} 瓶。`, `还要买：${each * target} - ${stock} = ${answer} 瓶。`],
            templateType: "归一干扰应用"
          });
        },
        () => {
          const total = rand(12, 36) * 20;
          const firstRate = pick([20, 25, 30, 40]);
          const second = rand(30, 120);
          const note = rand(5, 18);
          const answer = round1(total - total * firstRate / 100 - second);
          return baseQuestion(point, {
            text: `一本资料共有 ${total} 页，第一周读了 ${firstRate}%，第二周又读了 ${second} 页，书签夹在第 ${note} 章。还剩多少页没读？`,
            answer,
            word: true,
            explanation: `先把第一周读的百分数换成页数，再从总页数里减去两周读的页数；第几章是干扰信息。`,
            steps: [`第一周：${total} × ${firstRate}% = ${formatAnswer(round1(total * firstRate / 100))} 页。`, `两周已读：${formatAnswer(round1(total * firstRate / 100))} + ${second} = ${formatAnswer(round1(total * firstRate / 100 + second))} 页。`, `还剩：${total} - ${formatAnswer(round1(total * firstRate / 100 + second))} = ${formatAnswer(answer)} 页。`],
            templateType: "百分数干扰应用"
          });
        }
      ];
      const decimalPercentWord = [
        () => {
          const price = round1(rand(120, 480) / 10);
          const count = rand(2, 6);
          const answer = round1(price * count);
          return baseQuestion(point, {
            text: `一本笔记本 ${price} 元，买 ${count} 本需要多少元？`,
            answer,
            word: true,
            explanation: `单价是小数，数量相同，求总价用乘法。${price} × ${count} = ${formatAnswer(answer)} 元。`,
            steps: [`找到单价 ${price} 元。`, `买 ${count} 本，用乘法。`, `${price} × ${count} = ${formatAnswer(answer)} 元。`]
          });
        },
        () => {
          const pages = rand(6, 18) * 20;
          const percent = pick([10, 15, 20, 25, 30, 40]);
          const answer = round1(pages * percent / 100);
          return baseQuestion(point, {
            text: `一本书有 ${pages} 页，已经读了 ${percent}%。已经读了多少页？`,
            answer,
            word: true,
            explanation: `${percent}% 表示把整体分成 100 份取 ${percent} 份。${pages} × ${percent}% = ${formatAnswer(answer)} 页。`,
            steps: [`把 ${percent}% 看成 ${percent}/100。`, `用总页数乘百分数：${pages} × ${percent}%。`, `得到 ${formatAnswer(answer)} 页。`]
          });
        },
        () => {
          const price = rand(4, 15) * 20;
          const discount = pick([0.7, 0.75, 0.8, 0.85, 0.9]);
          const answer = round1(price * (1 - discount));
          return baseQuestion(point, {
            text: `书包原价 ${price} 元，现在打 ${discount * 10} 折，便宜了多少元？`,
            answer,
            word: true,
            explanation: `便宜的钱 = 原价 - 折后价。也可以用原价乘少掉的比例 ${formatAnswer(1 - discount)}。`,
            steps: [`折后价：${price} × ${discount} = ${formatAnswer(round1(price * discount))} 元。`, `便宜：${price} - ${formatAnswer(round1(price * discount))} = ${formatAnswer(answer)} 元。`]
          });
        },
        () => {
          const total = rand(9, 30) * 20;
          const firstRate = pick([20, 25, 30, 40]);
          const extra = rand(20, 90);
          const answer = round1(total * firstRate / 100 + extra);
          return baseQuestion(point, {
            text: `一本书有 ${total} 页，先读了 ${firstRate}%，又读了 ${extra} 页，一共读了多少页？`,
            answer,
            word: true,
            explanation: `先把百分数转成页数，再加上后来读的页数。`,
            steps: [`先读：${total} × ${firstRate}% = ${formatAnswer(round1(total * firstRate / 100))} 页。`, `一共：${formatAnswer(round1(total * firstRate / 100))} + ${extra} = ${formatAnswer(answer)} 页。`],
            templateType: "百分数应用"
          });
        },
        () => {
          const a = rand(3, 7);
          const b = a + rand(2, 5);
          const each = rand(12, 30);
          const total = (a + b) * each;
          const answer = each * b;
          return baseQuestion(point, {
            text: `把 ${total} 张卡片按 ${a}:${b} 分给两个小组，第二组分到多少张？`,
            answer,
            word: true,
            explanation: `比例分配先求总份数和每份数量，再乘第二组的份数。`,
            steps: [`总份数：${a} + ${b} = ${a + b}。`, `每份：${total} ÷ ${a + b} = ${each} 张。`, `第二组：${each} × ${b} = ${answer} 张。`],
            templateType: "比例分配"
          });
        }
      ];
      const formulaChoices = grade <= 2 ? formulaWord.slice(0, 4) : grade <= 4 ? formulaWord.slice(0, 5) : formulaWord;
      if (point.id === "g1-simple-word") return pick([...lowAddSub, ...formulaChoices])();
      if (point.id === "g2-simple-word") return pick([...lowAddSub, ...equalGroup, ...distractorWord, ...formulaChoices])();
      if (point.id === "g3-word-two-step") return pick([...twoStep, ...distractorWord, ...multiReasoningWord, ...formulaChoices])();
      if (point.id === "g4-word") return pick([...twoStep, ...upperWord, ...multiReasoningWord, ...upperDistractorWord, ...formulaChoices])();
      if (point.id === "g5-word" || point.id === "g6-complex-word") return pick([...upperWord, ...multiReasoningWord, ...upperDistractorWord, ...decimalPercentWord, ...formulaChoices])();
      if (grade <= 1) return pick([...lowAddSub, ...formulaChoices])();
      if (grade <= 2) return pick([...lowAddSub, ...equalGroup, ...distractorWord, ...formulaChoices])();
      if (grade <= 3) return pick([...equalGroup, ...twoStep, ...distractorWord, ...multiReasoningWord, ...formulaChoices])();
      if (grade <= 4) return pick([...twoStep, ...upperWord, ...multiReasoningWord, ...upperDistractorWord, ...formulaChoices])();
      return pick([...upperWord, ...multiReasoningWord, ...upperDistractorWord, ...decimalPercentWord, ...formulaChoices])();
    }

    function makeReading(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const readingQuestion = (data) => baseQuestion(point, {
        word: true,
        subskills: ["读懂问题", "筛选条件", "逻辑推理"],
        commonPitfalls: ["见数字就算", "忽略问题目标", "把干扰条件算进去"],
        ...data
      });
      const lowTemplates = [
        () => {
          const total = rand(12, 30);
          const red = rand(3, Math.floor(total / 2));
          const used = rand(2, total - red);
          return readingQuestion({
            text: `读题判断：盒子里有 ${total} 张贴纸，其中红色贴纸 ${red} 张。小明用掉 ${used} 张，要求还剩多少张。真正有用的两个数字是哪一组？① ${total} 和 ${red} ② ${total} 和 ${used} ③ ${red} 和 ${used}`,
            answer: 2,
            explanation: `题目问还剩多少，要用总数减用掉的数量；红色贴纸只是种类信息。`,
            steps: [`先看问题：要求还剩多少。`, `有用条件是总数 ${total} 和用掉 ${used}。`, `红色 ${red} 张不影响还剩总数，所以选 ②。`],
            templateType: "读题筛条件"
          });
        },
        () => {
          const eaten = rand(5, 16);
          const left = rand(4, 14);
          const carp = rand(1, Math.max(1, left - 1));
          return readingQuestion({
            text: `小猫吃了 ${eaten} 条鱼，还剩 ${left} 条，其中有 ${carp} 条是鲤鱼。要问原来有多少条鱼，下面哪句话是干扰条件？① 吃了 ${eaten} 条 ② 还剩 ${left} 条 ③ 其中有 ${carp} 条是鲤鱼`,
            answer: 3,
            explanation: `原来有多少 = 吃了的 + 剩下的。"其中有几条鲤鱼"只是说明剩下鱼的种类。`,
            steps: [`问题是求原来总数。`, `要用 ${eaten} 和 ${left}。`, `${carp} 条鲤鱼已经包含在剩下的 ${left} 条里，所以选 ③。`],
            templateType: "干扰条件识别"
          });
        },
        () => {
          const start = rand(8, 20);
          const add = rand(3, 10);
          const give = rand(2, 8);
          return readingQuestion({
            text: `小丽有 ${start} 支铅笔，妈妈又给她 ${add} 支，她送给同桌 ${give} 支。题目问"现在有多少支"，第一步应该先算什么？① ${start} + ${add} ② ${start} - ${give} ③ ${add} + ${give}`,
            answer: 1,
            explanation: `事情发生的顺序是先得到，再送出，所以第一步先把原来的和新得到的合起来。`,
            steps: [`先看顺序：原来有，再得到，然后送出。`, `第一步先算得到后的数量：${start} + ${add}。`, `所以选 ①。`],
            templateType: "步骤顺序判断"
          });
        },
        () => {
          const a = rand(6, 18);
          const b = a + rand(2, 9);
          return readingQuestion({
            text: `读题目标判断：小兔有 ${a} 个胡萝卜，小熊有 ${b} 个胡萝卜。题目问"小熊比小兔多多少个"，这是在求什么？① 两人一共有多少 ② 两人相差多少 ③ 小兔还剩多少`,
            answer: 2,
            explanation: `"比多多少"是在比较两个数量的差，不是求总数。`,
            steps: [`先抓关键词：比……多多少。`, `这是比较差。`, `所以选 ②。`],
            templateType: "问题目标识别"
          });
        },
        () => {
          const before = rand(1, 5);
          const after = rand(2, 6);
          const answer = before + 1 + after;
          return readingQuestion({
            text: `排队读题：小明前面有 ${before} 人，后面有 ${after} 人。这一队一共有多少人？`,
            answer,
            explanation: `排队总人数要把前面的人、小明自己、后面的人都算上。`,
            steps: [`前面有 ${before} 人。`, `小明自己也要算 1 人。`, `总人数：${before} + 1 + ${after} = ${answer} 人。`],
            templateType: "关系推理"
          });
        },
        () => {
          const page = rand(6, 14);
          const line = rand(3, 8);
          const words = rand(20, 60);
          return readingQuestion({
            text: `阅读信息筛选：小红今天读到第 ${page} 页，第 ${line} 行有 ${words} 个字。题目只问她读到第几页，应该填哪个数？`,
            answer: page,
            explanation: `问题只问第几页，行数和字数都是背景信息。`,
            steps: [`先看问题：读到第几页。`, `直接找页码 ${page}。`, `第 ${line} 行和 ${words} 个字不用参与计算。`],
            templateType: "直接信息定位"
          });
        },
        () => {
          const desk = rand(10, 24);
          const chair = desk + rand(2, 8);
          return readingQuestion({
            text: `教室里有 ${desk} 张桌子，椅子比桌子多 ${chair - desk} 把。下面哪句话一定正确？① 椅子有 ${chair} 把 ② 桌子比椅子多 ③ 桌子和椅子一样多`,
            answer: 1,
            explanation: `椅子比桌子多，就用桌子数量加多出的数量。`,
            steps: [`桌子有 ${desk} 张。`, `椅子多 ${chair - desk} 把。`, `椅子：${desk} + ${chair - desk} = ${chair}，所以选 ①。`],
            templateType: "结论判断"
          });
        },
        () => {
          const apples = rand(8, 18);
          const pears = rand(4, 12);
          const bananas = rand(5, apples + pears - 1);
          const answer = apples + pears - bananas;
          return readingQuestion({
            text: `水果记录：苹果 ${apples} 个，香蕉 ${bananas} 个，梨 ${pears} 个。问苹果和梨一共比香蕉多多少个？`,
            answer,
            explanation: `先把苹果和梨合起来，再和香蕉比较。`,
            steps: [`先合并要比较的一边：${apples} + ${pears} = ${apples + pears}。`, `再和香蕉比较：${apples + pears} - ${bananas} = ${answer}。`],
            templateType: "表格阅读"
          });
        }
      ];
      const middleTemplates = [
        () => {
          const price = rand(36, 85);
          const threshold = 40;
          const discount = pick([6, 8, 10]);
          const fee = rand(4, 8);
          return readingQuestion({
            text: `购物读题：一个书包 ${price} 元，满 ${threshold} 减 ${discount} 元，配送费 ${fee} 元。要判断实际支付，下面哪一步最先做？① 判断是否满 ${threshold} 元 ② 先加配送费 ③ 忽略商品原价`,
            answer: 1,
            explanation: `满减题要先判断商品金额是否达到满减条件，再考虑减免和配送费。`,
            steps: [`先看满减条件：满 ${threshold} 减 ${discount}。`, `商品 ${price} 元，已经满足条件。`, `所以第一步选 ①。`],
            templateType: "条件判断"
          });
        },
        () => {
          const each = rand(5, 12);
          const boxes = rand(4, 9);
          const extra = rand(6, 18);
          return readingQuestion({
            text: `${boxes} 盒水彩笔，每盒 ${each} 支，另外还有 ${extra} 支散装。要求一共有多少支，下面哪个算式正确？① ${boxes} + ${each} + ${extra} ② ${boxes} × ${each} + ${extra} ③ ${each} × ${extra} - ${boxes}`,
            answer: 2,
            explanation: `盒装要先用盒数乘每盒支数，再加散装。`,
            steps: [`盒装数量：${boxes} × ${each}。`, `再加散装 ${extra} 支。`, `正确算式是 ${boxes} × ${each} + ${extra}，选 ②。`],
            templateType: "列式选择"
          });
        },
        () => {
          const first = rand(18, 40);
          const second = first + rand(4, 18);
          const third = second - rand(1, 6);
          return readingQuestion({
            text: `三位同学跳绳：小林 ${first} 下，小雨比小林多 ${second - first} 下，小安比小雨少 ${second - third} 下。谁跳得最多？① 小林 ② 小雨 ③ 小安`,
            answer: 2,
            explanation: `先推出小雨和小安的数量，再比较大小。`,
            steps: [`小雨：${first} + ${second - first} = ${second} 下。`, `小安：${second} - ${second - third} = ${third} 下。`, `${second} 最大，所以选 ②。`],
            templateType: "关系推理"
          });
        },
        () => {
          const total = rand(80, 160);
          const days = rand(3, 6);
          const daily = rand(8, 18);
          return readingQuestion({
            text: `练习册有 ${total} 道题，已经做了 ${days} 天，每天做 ${daily} 道。下面哪句话是解决"还剩多少道"必须先知道的中间量？① 已经做了多少道 ② 每道题多难 ③ 练习册封面颜色`,
            answer: 1,
            explanation: `要求还剩多少，必须先算已经做了多少，再用总数减掉。`,
            steps: [`问题是还剩多少。`, `需要先知道已经完成的数量：${days} × ${daily}。`, `所以选 ①。`],
            templateType: "中间量识别"
          });
        },
        () => {
          const a = rand(14, 32);
          const b = rand(10, 28);
          const c = rand(8, 24);
          const max = Math.max(a, b, c);
          const min = Math.min(a, b, c);
          return readingQuestion({
            text: `统计读题：一组收集 ${a} 张卡片，二组 ${b} 张，三组 ${c} 张。题目问最多的一组比最少的一组多多少张，第一步应该先做什么？① 找最大和最小 ② 三个数全加起来 ③ 随便选两组相减`,
            answer: 1,
            explanation: `问最多比最少多多少，第一步要找最大数和最小数。`,
            steps: [`最大数是 ${max}。`, `最小数是 ${min}。`, `先找最大最小，所以选 ①。`],
            templateType: "统计阅读"
          });
        },
        () => {
          const groups = rand(4, 8);
          const quotient = rand(8, 16);
          const remainder = rand(1, groups - 1);
          const people = groups * quotient + remainder;
          return readingQuestion({
            text: `${people} 名同学坐车，每辆车坐 ${groups} 人。小华说只要算 ${people} ÷ ${groups} 的商就够了。这个判断对吗？① 对 ② 不对，因为有余下的人也需要车`,
            answer: 2,
            explanation: `坐车问题有余数时，余下的人也需要一辆车，不能只看商。`,
            steps: [`${people} ÷ ${groups} 会有余数 ${remainder}。`, `余下的同学也要坐车。`, `所以小华的判断不对，选 ②。`],
            templateType: "真假判断"
          });
        },
        () => {
          const start = rand(7, 10);
          const minutes = pick([20, 25, 35, 45]);
          const room = rand(2, 8);
          return readingQuestion({
            text: `通知写着：活动 ${start}:00 开始，经过 ${minutes} 分钟结束，地点在 ${room} 号教室。若只问结束时的分钟数，哪个条件最有用？① ${minutes} 分钟 ② ${room} 号教室 ③ ${start} 点里的 ${start}`,
            answer: 1,
            explanation: `题目只问分钟数，经过了多少分钟就是最直接的条件。`,
            steps: [`先看问题：结束时的分钟数。`, `从整点开始，分钟数由经过的 ${minutes} 分钟决定。`, `教室号是干扰条件，所以选 ①。`],
            templateType: "时间阅读"
          });
        },
        () => {
          const known = rand(3, 6);
          const each = rand(8, 16);
          const target = known + rand(2, 5);
          return readingQuestion({
            text: `${known} 袋糖共有 ${known * each} 颗，照这样装，要求 ${target} 袋有多少颗。下面哪一步应该先算？① 每袋有多少颗 ② ${target} - ${known} ③ ${known * each} + ${target}`,
            answer: 1,
            explanation: `"照这样装"是归一问题，要先求每袋数量，再求目标袋数。`,
            steps: [`已知 ${known} 袋共有 ${known * each} 颗。`, `先求每袋：${known * each} ÷ ${known}。`, `所以选 ①。`],
            templateType: "归一阅读"
          });
        }
      ];
      const upperTemplates = [
        () => {
          const price = rand(12, 45) * 10;
          const discount = pick([0.7, 0.8, 0.85, 0.9]);
          const coupon = rand(10, 40);
          const fee = rand(3, 9);
          return readingQuestion({
            text: `一件外套原价 ${price} 元，打 ${discount * 10} 折后还可用 ${coupon} 元券，另付包装费 ${fee} 元。判断实际支付时，下面哪条算式结构正确？① 原价 × 折扣 - 优惠券 + 包装费 ② 原价 - 优惠券 × 折扣 ③ 原价 × 折扣 + 优惠券 - 包装费`,
            answer: 1,
            explanation: `折扣先作用在原价上，再减优惠券，最后加必须支付的包装费。`,
            steps: [`先求折后价：原价 × 折扣。`, `再减优惠券。`, `包装费要支付，所以最后加，选 ①。`],
            templateType: "购物逻辑"
          });
        },
        () => {
          const total = rand(240, 720);
          const rate = pick([20, 25, 30, 40]);
          const extra = rand(30, 120);
          const chapter = rand(3, 12);
          return readingQuestion({
            text: `一本书 ${total} 页，第一周读了 ${rate}%，第二周读了 ${extra} 页，书签夹在第 ${chapter} 章。要求还剩多少页，哪条信息是干扰条件？① ${rate}% ② ${extra} 页 ③ 第 ${chapter} 章`,
            answer: 3,
            explanation: `还剩页数需要总页数、第一周百分数和第二周页数；第几章不参与页数计算。`,
            steps: [`要算已读页数和剩余页数。`, `${rate}% 和 ${extra} 页都有用。`, `第 ${chapter} 章不影响页数，所以选 ③。`],
            templateType: "百分数阅读"
          });
        },
        () => {
          const a = rand(2, 5);
          const b = rand(3, 7);
          const each = rand(12, 28);
          const total = (a + b) * each;
          return readingQuestion({
            text: `把 ${total} 元按 ${a}:${b} 分给甲乙两人。要判断乙分到多少，下面哪一步最关键？① 先求总份数 ${a}+${b} ② 直接用 ${total} × ${b} ③ 只看甲的份数`,
            answer: 1,
            explanation: `按比例分配要先求总份数，再求每份是多少。`,
            steps: [`比例是 ${a}:${b}。`, `第一步求总份数：${a} + ${b}。`, `所以选 ①。`],
            templateType: "比例阅读"
          });
        },
        () => {
          const speedA = rand(45, 80);
          const speedB = rand(35, 70);
          const time = rand(2, 5);
          return readingQuestion({
            text: `甲乙两车相向而行，甲每小时 ${speedA} 千米，乙每小时 ${speedB} 千米，行驶 ${time} 小时后相遇。下面哪句话一定正确？① 总路程等于两车速度和 × 时间 ② 总路程只等于甲车路程 ③ 乙车速度不用看`,
            answer: 1,
            explanation: `相向而行相遇时，总路程等于两车共同走过的路程。`,
            steps: [`一小时合起来接近：${speedA} + ${speedB}。`, `走 ${time} 小时，就乘 ${time}。`, `所以选 ①。`],
            templateType: "行程结论"
          });
        },
        () => {
          const avg = rand(75, 92);
          const count = 5;
          const known = [avg - 3, avg + 1, avg + 2, avg - 1];
          return readingQuestion({
            text: `${count} 次测验平均 ${avg} 分，前 4 次分别是 ${known.join("、")} 分。要求第 5 次成绩，必须先算什么？① 5 次总分 ② 最高分 ③ 最低分`,
            answer: 1,
            explanation: `平均数反推最后一次，要先用平均数乘次数求总分。`,
            steps: [`平均数 × 次数 = 总分。`, `总分再减前 4 次分数。`, `所以第一步选 ①。`],
            templateType: "平均数反推阅读"
          });
        },
        () => {
          const rows = rand(5, 9);
          const each = rand(8, 16);
          const used = rand(10, 30);
          const display = rand(2, 9);
          return readingQuestion({
            text: `会场有 ${rows} 排座位，每排 ${each} 个，已经坐了 ${used} 人，前排有 ${display} 个座位贴了号码。要求还空多少个座位，哪条信息不用参与计算？① ${rows} 排 ② 每排 ${each} 个 ③ ${display} 个座位贴了号码`,
            answer: 3,
            explanation: `空座位要用总座位数减已坐人数，座位是否贴号码不影响数量。`,
            steps: [`总座位数由 ${rows} 排和每排 ${each} 个决定。`, `已坐 ${used} 人也有用。`, `贴号码只是描述，所以选 ③。`],
            templateType: "干扰条件识别"
          });
        },
        () => {
          const salt = rand(8, 20);
          const water = rand(80, 180);
          const addWater = rand(20, 90);
          return readingQuestion({
            text: `盐水中有盐 ${salt} 克、水 ${water} 克，又加入 ${addWater} 克水。要判断新的浓度，哪句话最重要？① 盐的质量不变 ② 水的质量不变 ③ 加水后盐也增加`,
            answer: 1,
            explanation: `只加水时，盐没有增加也没有减少，所以盐的质量不变。`,
            steps: [`题目说又加入的是水。`, `盐仍然是 ${salt} 克。`, `所以选 ①。`],
            templateType: "必要条件判断"
          });
        },
        () => {
          const actual = rand(300, 1200);
          const scale = pick([1000, 2000, 5000, 10000]);
          return readingQuestion({
            text: `实际距离 ${actual} 米，比例尺 1:${scale}。要求图上距离，下面哪一步不能省？① 先把米换成厘米 ② 直接用米除以 ${scale} ③ 只看比例尺不用看距离`,
            answer: 1,
            explanation: `比例尺 1:${scale} 用的是厘米对应关系，实际距离要先换成厘米。`,
            steps: [`比例尺中的单位通常按厘米理解。`, `${actual} 米要先换成 ${actual * 100} 厘米。`, `所以选 ①。`],
            templateType: "单位条件判断"
          });
        },
        () => {
          const x = rand(4, 18);
          const factor = rand(2, 8);
          const add = rand(5, 24);
          return readingQuestion({
            text: `方程 ${factor}x + ${add} = ${factor * x + add}。要先求 x，第一步应该做什么？① 两边先减 ${add} ② 两边先乘 ${factor} ③ 把 ${add} 加一次`,
            answer: 1,
            explanation: `两步方程先去掉加上的数，再处理乘法。`,
            steps: [`先看 x 外面有乘 ${factor} 和加 ${add}。`, `要先去掉加上的 ${add}。`, `所以选 ①。`],
            templateType: "方程阅读"
          });
        }
      ];
      const distractorReadingTemplates = [
        () => {
          const total = rand(18, 36);
          const used = rand(4, 15);
          const color = rand(2, Math.max(2, total - used - 1));
          return readingQuestion({
            text: `干扰条件阅读：盒子里有 ${total} 张贴纸，用掉 ${used} 张，还剩的贴纸中有 ${color} 张是星星贴纸。题目问一共还剩多少张贴纸，哪个数字不用参加计算？1=${total}，2=${used}，3=${color}。`,
            answer: 3,
            explanation: `要求还剩多少张，只需要总数和用掉的数量。星星贴纸只是剩下贴纸中的一种，不影响还剩总数。`,
            steps: [`先看问题：还剩多少张贴纸。`, `有用数字是 ${total} 和 ${used}。`, `${color} 张星星贴纸是干扰条件，所以选 3。`],
            templateType: "干扰条件进阶"
          });
        },
        () => {
          const rows = rand(4, 8);
          const each = rand(6, 12);
          const absent = rand(3, 10);
          const numbered = rand(2, 8);
          return readingQuestion({
            text: `教室座位有 ${rows} 排，每排 ${each} 个，今天有 ${absent} 个座位空着，其中 ${numbered} 个座位贴了号码。要判断还坐了多少人，哪条信息是干扰条件？1=${rows} 排，2=每排 ${each} 个，3=${numbered} 个座位贴了号码。`,
            answer: 3,
            explanation: `坐了多少人要先算总座位，再减空座位。贴号码只是座位标记，不改变座位数量。`,
            steps: [`总座位需要 ${rows} 排和每排 ${each} 个。`, `空座位 ${absent} 个也有用。`, `贴号码 ${numbered} 个不影响人数，所以选 3。`],
            templateType: "干扰条件进阶"
          });
        },
        () => {
          const total = rand(240, 720);
          const rate = pick([20, 25, 30, 40]);
          const pages = rand(30, 120);
          const chapter = rand(4, 16);
          return readingQuestion({
            text: `一本书 ${total} 页，第一周读了 ${rate}%，第二周读了 ${pages} 页，书签夹在第 ${chapter} 章。要算还剩多少页，哪条信息最像有用但其实无关？1=${rate}%，2=${pages} 页，3=第 ${chapter} 章。`,
            answer: 3,
            explanation: `还剩页数需要总页数、第一周百分数、第二周页数。第几章不能直接表示页数，是干扰条件。`,
            steps: [`问题是还剩多少页。`, `${rate}% 和 ${pages} 页都参与已读页数。`, `第 ${chapter} 章不是页数条件，所以选 3。`],
            templateType: "干扰条件进阶"
          });
        }
      ];
      const pool = grade <= 2
        ? [...lowTemplates, distractorReadingTemplates[0]]
        : grade <= 4
          ? [...lowTemplates.slice(0, 4), ...middleTemplates, distractorReadingTemplates[1]]
          : [...middleTemplates.slice(0, 4), ...upperTemplates, distractorReadingTemplates[2]];
      return pick(pool)();
    }

    function makeAppendix(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const makers = {
        1: [
          () => {
            const start = rand(2, 8);
            const step = rand(2, 4);
            const a = start;
            const b = start + step;
            const c = start + step * 2;
            const answer = start + step * 3;
            return baseQuestion(point, {
              text: `找规律：${a}，${b}，${c}，下一个数是多少？`,
              answer,
              word: true,
              explanation: `这列数每次都增加 ${step}。从 ${c} 再加 ${step}，得到 ${answer}。`,
              steps: [`先看 ${a} 到 ${b} 增加了 ${step}。`, `再看 ${b} 到 ${c} 也增加了 ${step}。`, `所以下一个是 ${c} + ${step} = ${answer}。`]
            });
          },
          () => {
            const before = rand(2, 7);
            const after = rand(2, 7);
            const answer = before + after + 1;
            return baseQuestion(point, {
              text: `小猫排队，前面有 ${before} 只，后面有 ${after} 只。这一队一共有多少只小猫？`,
              answer,
              word: true,
              explanation: `排队题别忘了把"小猫自己"也算进去。前面 ${before} 只，后面 ${after} 只，再加自己 1 只。`,
              steps: [`前面有 ${before} 只。`, `后面有 ${after} 只。`, `总数 = ${before} + 1 + ${after} = ${answer}。`]
            });
          },
          () => {
            const a = rand(3, 9);
            const b = a + rand(2, 5);
            const c = b + rand(2, 5);
            const answer = b;
            return baseQuestion(point, {
              text: `把 ${a}、${b}、${c} 从小到大排，中间的数是多少？`,
              answer,
              word: true,
              explanation: `先按从小到大排好，排在中间的就是第二个数。${a}、${b}、${c} 中间是 ${answer}。`,
              steps: [`从小到大：${a} < ${b} < ${c}。`, `中间位置是第二个。`, `中间的数是 ${answer}。`]
            });
          }
        ],
        2: [
          () => {
            const cycle = ["红", "黄", "蓝"];
            const n = rand(10, 30 + level * 4);
            const answer = (n - 1) % cycle.length + 1;
            return baseQuestion(point, {
              text: `彩灯按"红、黄、蓝"循环排列，第 ${n} 盏灯是第几种颜色？（红填1，黄填2，蓝填3）`,
              answer,
              word: true,
              explanation: `这是周期问题。3 盏一组，看第 ${n} 盏在这一组里的第几个位置。余数 ${n % 3 || 3} 对应第 ${answer} 种颜色。`,
              steps: [`一组有 3 盏。`, `${n} ÷ 3 看余数。`, `位置是第 ${answer} 种。`]
            });
          },
          () => {
            const each = rand(3, 8);
            const known = rand(2, 5);
            const target = known + rand(2, 4);
            const answer = each * target;
            return baseQuestion(point, {
              text: `${known} 个盒子装了 ${each * known} 块橡皮，照这样装，${target} 个盒子装多少块？`,
              answer,
              word: true,
              explanation: `先求每个盒子装多少，再求 ${target} 个盒子。这里每盒 ${each} 块，所以 ${target} 盒是 ${answer} 块。`,
              steps: [`每盒：${each * known} ÷ ${known} = ${each} 块。`, `${target} 盒：${each} × ${target} = ${answer} 块。`]
            });
          },
          () => {
            const group = rand(2, 6);
            const fullGroups = rand(4, 9);
            const missing = rand(1, group - 1);
            const total = fullGroups * group + (group - missing);
            return baseQuestion(point, {
              text: `${total} 个珠子按每组 ${group} 个圈起来，最后一组还差 ${missing} 个才能满一组。已经圈满了多少组？`,
              answer: fullGroups,
              word: true,
              explanation: `最后一组还差 ${missing} 个，说明最后一组已经有 ${group - missing} 个。先拿掉这不满的一组，再看前面有多少整组。`,
              steps: [`不满的一组有 ${group} - ${missing} = ${group - missing} 个。`, `整组部分有 ${total} - ${group - missing} = ${fullGroups * group} 个。`, `${fullGroups * group} ÷ ${group} = ${fullGroups} 组。`]
            });
          }
        ],
        3: [
          () => {
            const diff = rand(4, 14) * 2;
            const small = rand(12, 36);
            const big = small + diff;
            return baseQuestion(point, {
              text: `甲有 ${big} 张卡片，乙有 ${small} 张。甲给乙多少张后，两人一样多？`,
              answer: diff / 2,
              word: true,
              explanation: `两人差 ${diff} 张。要变得一样多，只要把差的一半从多的人给少的人。`,
              steps: [`先求差：${big} - ${small} = ${diff}。`, `差的一半是 ${diff} ÷ 2 = ${diff / 2}。`, `甲给乙 ${diff / 2} 张后一样多。`]
            });
          },
          () => {
            const gap = rand(3, 7);
            const trees = rand(6, 18);
            const answer = (trees - 1) * gap;
            return baseQuestion(point, {
              text: `一条路的一边种了 ${trees} 棵树，每两棵相距 ${gap} 米，从第一棵到最后一棵相距多少米？`,
              answer,
              word: true,
              explanation: `植树问题要先数"间隔"。${trees} 棵树之间有 ${trees - 1} 个间隔，每个间隔 ${gap} 米。`,
              steps: [`间隔数 = ${trees} - 1 = ${trees - 1}。`, `总距离 = ${trees - 1} × ${gap} = ${answer} 米。`]
            });
          },
          () => {
            const divisor = rand(4, 9);
            const quotient = rand(5, 12);
            const remainder = rand(1, divisor - 1);
            const total = divisor * quotient + remainder;
            return baseQuestion(point, {
              text: `${total} 个苹果装箱，每箱装 ${divisor} 个，装满后还剩几个苹果？`,
              answer: remainder,
              word: true,
              explanation: `这是余数问题。先看最多能装满多少箱，再看剩下多少。${total} ÷ ${divisor} = ${quotient} 余 ${remainder}。`,
              steps: [`找 ${divisor} 的倍数：${divisor} × ${quotient} = ${divisor * quotient}。`, `${total} - ${divisor * quotient} = ${remainder}。`, `所以还剩 ${remainder} 个。`]
            });
          }
        ],
        4: [
          () => {
            const small = rand(12, 36);
            const times = rand(2, 4);
            const sum = small + small * times;
            return baseQuestion(point, {
              text: `甲、乙共有 ${sum} 本书，甲的本数是乙的 ${times} 倍。乙有多少本？`,
              answer: small,
              word: true,
              explanation: `和倍问题先看"份数"。乙是 1 份，甲是 ${times} 份，一共 ${times + 1} 份。`,
              steps: [`总份数：${times} + 1 = ${times + 1}。`, `每份：${sum} ÷ ${times + 1} = ${small}。`, `乙是 1 份，所以乙有 ${small} 本。`]
            });
          },
          () => {
            const gap = rand(4, 8);
            const length = gap * rand(10, 24);
            const answer = length / gap + 1;
            return baseQuestion(point, {
              text: `一条 ${length} 米长的小路，两端都种树，每隔 ${gap} 米种一棵。一共种多少棵？`,
              answer,
              word: true,
              explanation: `两端都种树，棵数 = 间隔数 + 1。先算 ${length} ÷ ${gap} = ${length / gap} 个间隔。`,
              steps: [`间隔数：${length} ÷ ${gap} = ${length / gap}。`, `两端都种，所以加 1。`, `棵数 = ${length / gap} + 1 = ${answer}。`]
            });
          },
          () => {
            const age = rand(8, 15);
            const diff = rand(18, 32);
            const years = rand(3, 8);
            return baseQuestion(point, {
              text: `小明今年 ${age} 岁，爸爸比他大 ${diff} 岁。${years} 年后爸爸比小明大多少岁？`,
              answer: diff,
              word: true,
              explanation: `年龄差不会随着时间改变。过了 ${years} 年，两个人都长 ${years} 岁，差仍然是 ${diff} 岁。`,
              steps: [`现在爸爸比小明大 ${diff} 岁。`, `${years} 年后两人都增加 ${years} 岁。`, `年龄差仍是 ${diff} 岁。`]
            });
          }
        ],
        5: [
          () => {
            const chickens = rand(8, 22);
            const rabbits = rand(5, 16);
            const heads = chickens + rabbits;
            const feet = chickens * 2 + rabbits * 4;
            return baseQuestion(point, {
              text: `鸡兔同笼，共 ${heads} 个头、${feet} 条腿。兔有多少只？`,
              answer: rabbits,
              word: true,
              explanation: `先假设全是鸡，就有 ${heads * 2} 条腿。多出来的腿每只兔比鸡多 2 条，所以兔数是差 ÷ 2。`,
              steps: [`假设全是鸡：${heads} × 2 = ${heads * 2} 条腿。`, `多出来：${feet} - ${heads * 2} = ${feet - heads * 2} 条。`, `兔子：${feet - heads * 2} ÷ 2 = ${rabbits} 只。`]
            });
          },
          () => {
            const speedA = rand(45, 70);
            const speedB = speedA + rand(10, 25);
            const time = rand(2, 5);
            const answer = (speedA + speedB) * time;
            return baseQuestion(point, {
              text: `两车从两地同时相向而行，甲每小时 ${speedA} 千米，乙每小时 ${speedB} 千米，${time} 小时相遇。两地相距多少千米？`,
              answer,
              word: true,
              explanation: `相向而行时，每小时合起来接近 ${speedA + speedB} 千米。再乘时间就是总路程。`,
              steps: [`速度和：${speedA} + ${speedB} = ${speedA + speedB}。`, `总路程：${speedA + speedB} × ${time} = ${answer} 千米。`]
            });
          },
          () => {
            const a = rand(6, 12);
            const b = a + rand(2, 6);
            const days = rand(3, 8);
            const answer = (a + b) * days;
            return baseQuestion(point, {
              text: `甲每天做 ${a} 个零件，乙每天做 ${b} 个零件，两人合作 ${days} 天一共做多少个？`,
              answer,
              word: true,
              explanation: `合作问题先求一天合做多少，再乘天数。${a} + ${b} = ${a + b}，再乘 ${days}。`,
              steps: [`一天合做：${a} + ${b} = ${a + b} 个。`, `${days} 天：${a + b} × ${days} = ${answer} 个。`]
            });
          }
        ],
        6: [
          () => {
            const a = rand(4, 8);
            const b = a + rand(2, 5);
            const total = (a + b) * rand(12, 28);
            const answer = total / (a + b) * b;
            return baseQuestion(point, {
              text: `把 ${total} 元按 ${a}:${b} 分给甲乙两人，乙分到多少元？`,
              answer,
              word: true,
              explanation: `比例分配先求总份数，再求每份。乙占 ${b} 份。`,
              steps: [`总份数：${a} + ${b} = ${a + b}。`, `每份：${total} ÷ ${a + b} = ${total / (a + b)}。`, `乙：${total / (a + b)} × ${b} = ${answer} 元。`]
            });
          },
          () => {
            const water = rand(80, 180);
            const salt = rand(8, 30);
            const addWater = rand(20, 80);
            const answer = round1(salt / (water + salt + addWater) * 100);
            return baseQuestion(point, {
              text: `有盐 ${salt} 克、水 ${water} 克，又加入 ${addWater} 克水。现在盐水浓度约是多少%？`,
              answer,
              word: true,
              explanation: `浓度 = 盐的质量 ÷ 盐水总质量 × 100%。加水后盐不变，总质量变大。`,
              steps: [`盐仍是 ${salt} 克。`, `盐水总质量：${salt} + ${water} + ${addWater} = ${salt + water + addWater} 克。`, `浓度：${salt} ÷ ${salt + water + addWater} × 100% ≈ ${formatAnswer(answer)}%。`]
            });
          },
          () => {
            const speedA = rand(50, 80);
            const speedB = rand(35, 60);
            const distance = (speedA + speedB) * rand(3, 6);
            const answer = round1(distance / (speedA + speedB));
            return baseQuestion(point, {
              text: `甲乙两车相向而行，相距 ${distance} 千米。甲每小时 ${speedA} 千米，乙每小时 ${speedB} 千米，几小时相遇？`,
              answer,
              word: true,
              explanation: `相向而行时用速度和。时间 = 路程 ÷ 速度和。${distance} ÷ (${speedA} + ${speedB}) = ${formatAnswer(answer)}。`,
              steps: [`速度和：${speedA} + ${speedB} = ${speedA + speedB}。`, `时间：${distance} ÷ ${speedA + speedB} = ${formatAnswer(answer)} 小时。`]
            });
          }
        ]
      };
      return pick(makers[grade] || makers[6])();
    }

    return {
      makeSupplementalQuestion,
      makeExtraQuestion,
      makeAddSub,
      makeCompare,
      makeMulDiv,
      makeRemainder,
      makeMixed,
      makeTwoStep,
      makeVertical,
      makeLarge,
      makeAngleTriangleGeometry,
      makeMotionAreaGeometry,
      makeSolidPositionGeometry,
      makeGeometry,
      makeThinking,
      makeDecimal,
      makeFraction,
      makeUnit,
      makePercent,
      makeRatio,
      makeStatistics,
      makeEquation,
      makeWord,
      makeReading,
      makeAppendix,
      makers: {
        addsub: makeAddSub,
        compare: makeCompare,
        muldiv: makeMulDiv,
        remainder: makeRemainder,
        mixed: makeMixed,
        twostep: makeTwoStep,
        vertical: makeVertical,
        large: makeLarge,
        geometry: makeGeometry,
        decimal: makeDecimal,
        fraction: makeFraction,
        unit: makeUnit,
        percent: makePercent,
        ratio: makeRatio,
        statistics: makeStatistics,
        equation: makeEquation,
        word: makeWord,
        reading: makeReading,
        thinking: makeThinking,
        appendix: makeAppendix
      }
    };
  }

  window.MathCampMathQuestionMakers = { create };
})();
