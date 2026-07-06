(function () {
  "use strict";

  function create(deps) {
    const state = deps.state;

    function chooseInteractionMode(question, preferred = state.answerMode || "auto") {
      preferred = deps.normalizeAnswerModeForViewport(preferred);
      if (question.answerType === "formula") return "input";
      if (deps.isNonMathQuestion(question)) {
        if (preferred === "step") return "input";
        if (preferred === "choice") return question.answerType === "choice" ? "choice" : "input";
        if (preferred === "judge") return "judge";
        if (preferred !== "auto") return "input";
        if (question.answerType === "choice") return "choice";
        if (question.answerType === "judge") return "judge";
        return "input";
      }
      if (preferred !== "auto") return preferred;
      if (question.answerType === "longText" || question.answerType === "selfReview") return "input";
      if (question.answerType === "choice") return "choice";
      if (question.answerType === "judge") return "judge";
      if (question.answerType === "text" || Array.isArray(question.acceptedAnswers)) return "input";
      if (question.word || question.topic === "mixed" || question.topic === "twostep" || question.topic === "vertical" || question.topic === "geometry" || question.topic === "reading" || question.topic === "thinking") return deps.isMobilePracticeViewport() ? "input" : "step";
      if (question.topic === "compare" || question.topic === "muldiv") return Math.random() > 0.5 ? "choice" : "input";
      if (question.topic === "addsub" && Math.random() > 0.7) return "judge";
      return "input";
    }

    function numericDistractors(answer) {
      const base = Number(answer);
      const allowNegative = base < 0;
      const offsets = deps.shuffle([-10, -5, -2, -1, 1, 2, 5, 10, 12]);
      const values = [];
      offsets.forEach((offset) => {
        const value = Number.isInteger(base) ? base + offset : deps.round1(base + offset / 10);
        if (Number.isFinite(value) && (allowNegative || value >= 0) && !values.includes(value) && Math.abs(value - base) > 0.001) values.push(value);
      });
      return values.slice(0, 3);
    }

    function textAnswerValue(question) {
      const value = question?.answer ?? question?.acceptedAnswers?.[0] ?? question?.answerLabel ?? "";
      const text = String(value).trim();
      const letter = text.match(/^[A-D]/i)?.[0];
      return letter ? letter.toUpperCase() : text;
    }

    function textChoiceOptions(question) {
      if (Array.isArray(question?.options) && question.options.length) {
        return question.options.map((option) => ({
          label: String(option.label ?? option.text ?? option.value ?? "").trim(),
          value: String(option.value ?? option.label ?? option.text ?? "").trim()
        })).filter((option) => option.label && option.value);
      }
      const text = String(question?.text || "");
      const split = deps.splitInlineChoiceText(text);
      return (split?.options || []).map((option) => ({ label: `${option.key}. ${option.text}`, value: option.key }));
    }

    function textWrongOption(question) {
      return textChoiceOptions(question).find((option) => !deps.textAnswerMatches(option.value, question) && !deps.textAnswerMatches(option.label, question))
        || { label: "一个不符合题意的答案", value: "__wrong_text_answer__" };
    }

    function applyQuestionInteraction(question, preferred = state.answerMode || "auto") {
      const mode = chooseInteractionMode(question, preferred);
      let finalMode = question.answerLabel && (mode === "choice" || mode === "judge") ? "input" : mode;
      if (deps.isNonMathQuestion(question)) {
        if (mode === "step") {
          finalMode = "input";
        } else if (mode === "choice") {
          finalMode = textChoiceOptions(question).length >= 2 ? "choice" : "input";
        } else if (mode === "judge") {
          finalMode = deps.isSelfReviewQuestion(question) || !textAnswerValue(question) ? "input" : "judge";
        }
      }
      const interaction = { mode: finalMode };
      if (finalMode === "choice") {
        if (deps.isNonMathQuestion(question)) {
          interaction.options = textChoiceOptions(question);
        } else {
          const options = deps.shuffle([Number(question.answer), ...numericDistractors(question.answer)]).slice(0, 4);
          if (!options.some((value) => Math.abs(value - Number(question.answer)) < 0.001)) options[0] = Number(question.answer);
          interaction.options = deps.shuffle(options).map((value) => ({ label: deps.formatAnswer(value), value }));
        }
      } else if (finalMode === "judge") {
        const truthful = Math.random() > 0.5;
        if (deps.isNonMathQuestion(question)) {
          const wrong = textWrongOption(question);
          const correct = textAnswerValue(question);
          interaction.statementValue = truthful ? correct : wrong.value;
          interaction.statementLabel = truthful ? deps.formatAnswer(correct, question.answerLabel) : wrong.label;
        } else {
          const wrong = numericDistractors(question.answer)[0] ?? Number(question.answer) + 1;
          interaction.statementValue = truthful ? Number(question.answer) : wrong;
        }
        interaction.truthful = truthful;
      }
      question.interaction = interaction;
      return question;
    }

    function interactionRuleIssues(question) {
      const interaction = question?.interaction;
      if (!interaction) return [];
      const issues = [];
      if (!["input", "choice", "judge", "step"].includes(interaction.mode)) issues.push("答题方式未知");
      if (question?.answerType === "formula" && interaction.mode !== "input") issues.push("列算式题应使用输入框");
      if (question?.answerType === "formula" && ![question.formulaAnswer, ...(question.acceptedFormulas || [])].some((item) => deps.normalizeFormulaAnswer(item).includes("="))) issues.push("列算式题缺少参考算式");
      if (interaction.mode === "choice") {
        if (deps.isNonMathQuestion(question)) {
          const options = interaction.options || [];
          if (options.length < 2) issues.push("选择题选项不足");
          if (!options.some((option) => deps.textAnswerMatches(option.value, question) || deps.textAnswerMatches(option.label, question))) issues.push("选择题缺少正确答案");
        } else {
          const values = (interaction.options || []).map((option) => Number(option.value));
          if (values.length < 2) issues.push("选择题选项不足");
          if (!values.some((value) => Math.abs(value - Number(question.answer)) < 0.001)) issues.push("选择题缺少正确答案");
        }
      }
      if (interaction.mode === "judge") {
        if (deps.isNonMathQuestion(question)) {
          if (!String(interaction.statementValue || interaction.statementLabel || "").trim()) issues.push("判断题陈述答案无效");
        } else if (!Number.isFinite(Number(interaction.statementValue))) issues.push("判断题陈述答案无效");
        if (typeof interaction.truthful !== "boolean") issues.push("判断题真假值无效");
      }
      if (interaction.mode === "step" && !(question.steps || []).length) issues.push("分步题缺少步骤");
      return issues;
    }

    return {
      applyQuestionInteraction,
      chooseInteractionMode,
      interactionRuleIssues,
      numericDistractors,
      textAnswerValue,
      textChoiceOptions
    };
  }

  window.MathCampQuestionInteraction = { create };
})();
