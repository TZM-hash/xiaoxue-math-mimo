(function () {
  "use strict";

  function create(deps) {
    const isNonMathQuestion = deps.isNonMathQuestion;
    const formatAnswer = deps.formatAnswer;
    const round1 = deps.round1;

    function questionNumbers(question) {
      return (String(question?.text || "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter(Number.isFinite);
    }

    function questionPatternKey(question) {
      return String(question?.text || "")
        .replace(/-?\d+(?:\.\d+)?/g, "#")
        .replace(/[A-Za-z]/g, "x")
        .replace(/\s+/g, "")
        .slice(0, 80);
    }

    function textHas(question, pattern) {
      return pattern.test(`${question?.text || ""} ${question?.answerLabel || ""} ${question?.explanation || ""}`);
    }

    function textHasMulDiv(question) {
      return textHas(question, /[×÷]/);
    }

    function decimalDisplayIssues(question) {
      const source = [
        question?.text,
        question?.answerLabel,
        question?.explanation,
        ...(Array.isArray(question?.steps) ? question.steps : [])
      ].filter((item) => typeof item === "string").join(" ");
      const matches = source.match(/-?\d+\.\d+/g) || [];
      return matches.filter((item) => !/^-?\d+\.\d{2}$/.test(item));
    }

    function topicSpecificRuleIssues(point, question) {
      const issues = [];
      if (!point || !question) return issues;
      if (!Array.isArray(question.subskills) || !question.subskills.length) issues.push("缺少子技能标记");
      if (!Array.isArray(question.commonPitfalls) || !question.commonPitfalls.length) issues.push("缺少易错点标记");
      if (!question.templateType) issues.push("缺少模板类型标记");
      if (!question.curriculumBand) issues.push("缺少课程层级标记");
      if (Number(point.grade) === 1 && textHasMulDiv(question)) issues.push("一年级题目混入乘除法");
      const decimalLeaks = decimalDisplayIssues(question);
      if (decimalLeaks.length) issues.push(`小数显示未保留两位：${decimalLeaks.slice(0, 3).join("、")}`);
      if (point.topic === "remainder" && !textHas(question, /余|至少需要|最多能装满|不用填/)) issues.push("余数题缺少余数语境");
      if (point.topic === "fraction" && !textHas(question, /\/|分数|百分|几分之/)) issues.push("分数题缺少分数语境");
      if (point.topic === "percent" && !textHas(question, /%|百分|折/)) issues.push("百分数题缺少百分数/折扣语境");
      if (point.topic === "ratio" && !textHas(question, /比例|比例尺|份|:/)) issues.push("比例题缺少比例语境");
      if (point.topic === "unit" && !textHas(question, /米|厘米|千克|克|小时|分|元|角|公顷|平方米|千米/)) issues.push("单位题缺少单位换算语境");
      if (point.topic === "equation" && !textHas(question, /x|方程|未知数/)) issues.push("方程题缺少未知数语境");
      if (point.topic === "statistics" && !textHas(question, /平均|统计|表|数据|最多|最少|合计/)) issues.push("统计题缺少统计语境");
      if (point.id === "g6-circle" && !textHas(question, /圆|半径|直径|π|3\.14/)) issues.push("圆题缺少圆的公式语境");
      if (point.id === "g5-volume" && !textHas(question, /长方体|正方体|体积|表面积|立方/)) issues.push("体积题缺少立体图形语境");
      if (point.topic === "reading" && !textHas(question, /读题|有用|无关|干扰|先算|结论|判断|一定|条件|推理|序号/)) issues.push("思维阅读题缺少阅读推理语境");
      if (point.topic === "thinking" && !textHas(question, /估算|合理|策略|量感|改错|错误|开放|可能|表|票据|课程|规律|至少|分类|算式|表达|序号|选择|例如|干扰|有用|无关/)) issues.push("思维精进题缺少分类训练语境");
      if (point.id === "g4-area" && !textHas(question, /面积|平方米|平方厘米/)) issues.push("面积专项混入非面积题");
      if (point.id === "g2-table-div" && !textHas(question, /÷|平均分|每人|分成|每 \d+ 个/)) issues.push("表内除法专项混入非除法题");
      if (point.id === "g5-decimal-add" && textHas(question, /[×÷]/)) issues.push("小数加减专项混入乘除题");
      if (point.id === "g6-scale" && !textHas(question, /比例尺|图上|实际距离/)) issues.push("比例尺专项混入普通比例题");
      if (point.topic === "mixed" && !/[×÷()+\-]/.test(String(question.text || ""))) issues.push("混合运算题缺少运算符");
      if (point.topic === "twostep" && !/[×÷()+\-]/.test(String(question.text || ""))) issues.push("两步计算题缺少运算符");
      if (point.topic === "vertical" && !textHas(question, /竖式|数位|对齐|进位|退位|试商|小数点/)) issues.push("竖式题缺少竖式计算语境");
      return issues;
    }

    function isCarryOrBorrow100(question) {
      const text = String(question?.text || "");
      const add = text.match(/^(\d+)\s*\+\s*(\d+)/);
      const sub = text.match(/^(\d+)\s*-\s*(\d+)/);
      if (add) {
        const a = Number(add[1]);
        const b = Number(add[2]);
        return a > 0 && b > 0 && a + b <= 100 && a + b === Number(question.answer) && (a % 10) + (b % 10) >= 10;
      }
      if (sub) {
        const a = Number(sub[1]);
        const b = Number(sub[2]);
        return a <= 100 && b > 0 && a > b && a - b === Number(question.answer) && (a % 10) < (b % 10);
      }
      return false;
    }

    function tryEvaluateQuestion(question) {
      const text = String(question?.text || "").trim();
      if (question?.word) return NaN;
      if (question?.answerLabel && /余|:|%|\/|辆|袋|个|元|米|厘米|平方|立方|小时|分钟/.test(question.answerLabel)) return NaN;
      if (/余|至少|最多|填写商|填余数|可填小数|π|取3\.14/.test(text)) return NaN;
      const expr = text.replace(/=.+$/, "").replace("?", "").trim();
      if (!/^[\d\s+\-×÷().]+$/.test(expr)) return NaN;
      const jsExpr = expr.replace(/×/g, "*").replace(/÷/g, "/");
      try {
        const value = Function(`"use strict"; return (${jsExpr});`)();
        return Number.isFinite(value) ? round1(value) : NaN;
      } catch (_) {
        return NaN;
      }
    }

    function questionRuleIssues(point, question) {
      const issues = [];
      if (!point || !question) return ["题目为空"];
      if (Number(question.grade) !== Number(point.grade)) issues.push("年级不一致");
      if (question.pointId !== point.id) issues.push("知识点不一致");
      if (question.topic !== point.topic) issues.push("题型主题不一致");
      if (isNonMathQuestion(question) || isNonMathQuestion(point)) {
        if (!question.explanation) issues.push("缺少解析");
        if (!Array.isArray(question.steps) || !question.steps.length) issues.push("缺少步骤");
        if (!question.answer && !question.answerLabel) issues.push("缺少参考答案");
        if (!["choice", "text", "judge", "longText", "selfReview"].includes(question.answerType)) issues.push("非数学题答案类型无效");
        return issues;
      }
      const numbers = questionNumbers(question);
      const answer = Number(question.answer);
      if (!Number.isFinite(answer)) issues.push("答案不是数字");
      if (point.id === "g1-10-add" && Math.max(...numbers, answer) > 10) issues.push("10以内题越界");
      if (point.id === "g1-20-add" && Math.max(...numbers, answer) > 20) issues.push("20以内题越界");
      if (point.id === "g2-100-add") {
        if (Math.max(...numbers, answer) > 100 || answer < 0) issues.push("100以内题越界");
        if (question.word) issues.push("100以内进退位混入应用题");
        if (!isCarryOrBorrow100(question)) issues.push("不是进位加法或退位减法");
      }
      const calculated = tryEvaluateQuestion(question);
      if (Number.isFinite(calculated) && Math.abs(calculated - answer) > 0.08) issues.push(`题干算式与答案不一致，应为 ${formatAnswer(calculated)}`);
      issues.push(...topicSpecificRuleIssues(point, question));
      return issues;
    }

    return {
      questionNumbers,
      questionPatternKey,
      questionRuleIssues,
      topicSpecificRuleIssues,
      tryEvaluateQuestion
    };
  }

  window.MathCampQuestionRules = { create };
})();
