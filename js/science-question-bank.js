(function () {
  "use strict";

  const curriculumData = window.MathCampScienceCurriculumData || {};
  const curriculumProfile = curriculumData.curriculumProfile || {
    region: "浙江省杭州市",
    textbook: "小学科学（教科版/浙江常用教材能力线）",
    publisher: "教育科学出版社"
  };
  const grades = [1, 2, 3, 4, 5, 6];
  const gradeNames = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];
  const causes = ["不会做", "概念不清", "观察实验", "证据推理"];
  const topicLabels = {
    life: "生命科学",
    matter: "物质科学",
    earth: "地球宇宙",
    engineering: "工程技术",
    inquiry: "科学探究"
  };
  const topicShort = {
    life: "生命",
    matter: "物质",
    earth: "地球",
    engineering: "工程",
    inquiry: "探究"
  };
  const topicHelpers = {
    life: "观察动植物和人体结构，理解生命活动与环境的关系。",
    matter: "比较材料和物质变化，能用性质解释生活现象。",
    earth: "观察天气、岩石土壤、地球和宇宙现象，建立模型解释变化。",
    engineering: "根据需求选择材料、设计结构、测试并改进方案。",
    inquiry: "提出问题、控制变量、记录数据，并用证据支持结论。"
  };
  const pointMeta = {
    1: {
      life: ["s1-life-plant-basic", "植物的基本特征", "观察根、茎、叶和生长变化"],
      matter: ["s1-matter-material-basic", "身边材料和用途", "比较纸、塑料、金属等材料性质"],
      earth: ["s1-earth-weather-record", "天气观察记录", "读懂晴雨风和温度变化"],
      engineering: ["s1-engineering-stable-structure", "稳定小结构", "搭建并测试支撑结构"],
      inquiry: ["s1-inquiry-observe-record", "观察和记录", "用图表记录观察结果"]
    },
    2: {
      life: ["s2-life-animal-cycle", "动物生命周期", "按证据排序动物生长变化"],
      matter: ["s2-matter-water-air", "水和空气的性质", "观察流动、占空间和可压缩现象"],
      earth: ["s2-earth-weather-compare", "天气现象比较", "比较风、雨、云和气温"],
      engineering: ["s2-engineering-bridge-load", "纸桥承重", "测试形状对承重的影响"],
      inquiry: ["s2-inquiry-predict-test", "预测和测试", "先预测再用实验验证"]
    },
    3: {
      life: ["s3-life-plant-cycle", "植物生命周期", "解释种子发芽到开花结果"],
      matter: ["s3-matter-water-state", "水的三态变化", "观察蒸发、凝结和结冰"],
      earth: ["s3-earth-air-weather", "空气和天气", "用空气运动解释风"],
      engineering: ["s3-engineering-motion-car", "小车运动改进", "比较斜面和车轮对运动的影响"],
      inquiry: ["s3-inquiry-fair-test", "公平实验", "只改变一个条件，其余条件保持相同"]
    },
    4: {
      life: ["s4-life-plant-function", "植物结构功能", "用证据说明根茎叶的作用"],
      matter: ["s4-matter-sound-light", "声音和光现象", "用振动、传播和影子解释现象"],
      earth: ["s4-earth-rock-soil", "岩石和土壤", "观察颗粒、颜色和沉降进行分类"],
      engineering: ["s4-engineering-circuit", "简单电路", "搭建闭合回路并排查故障"],
      inquiry: ["s4-inquiry-evidence-explain", "证据解释", "用观察证据支持科学结论"]
    },
    5: {
      life: ["s5-life-ecosystem", "生态系统关系", "分析食物链和栖息地变化"],
      matter: ["s5-matter-dissolve", "溶解和分离", "比较影响溶解快慢的条件"],
      earth: ["s5-earth-surface-change", "地表变化", "用模拟实验解释侵蚀和沉积"],
      engineering: ["s5-engineering-simple-machine", "简单机械", "比较杠杆、轮轴和滑轮的作用"],
      inquiry: ["s5-inquiry-data-evidence", "数据和证据", "从数据中判断结论是否可靠"]
    },
    6: {
      life: ["s6-life-human-system", "人体系统协同", "解释呼吸、循环和消化的配合"],
      matter: ["s6-matter-energy-transfer", "能量转换", "追踪电能、光能、热能和机械能"],
      earth: ["s6-earth-solar-system", "太阳系模型", "用模型解释行星运动和月相"],
      engineering: ["s6-engineering-system-optimize", "工程系统优化", "用指标评价并改进系统"],
      inquiry: ["s6-inquiry-model-reasoning", "模型和推理", "用模型解释看不见或尺度很大的现象"]
    }
  };

  function curriculumFor(grade, topic, meta) {
    const detail = meta || {};
    return {
      region: curriculumProfile.region,
      textbook: curriculumProfile.textbook,
      publisher: curriculumProfile.publisher,
      stage: detail.stage || "课内教材",
      term: detail.term || `${grade}年级科学`,
      unit: detail.unit || topicLabels[topic],
      knowledge: detail.knowledge || {},
      questionTypes: detail.questionTypes || ["现象判断", "实验设计", "证据推理", "概念填空"],
      band: `${curriculumProfile.region} / ${curriculumProfile.textbook} / ${grade}年级 / ${detail.unit || topicLabels[topic]}`
    };
  }

  function createPoint(grade, topic) {
    const [id, label, helperDetail] = pointMeta[grade][topic];
    return {
      id,
      subject: "science",
      grade,
      topic,
      label,
      short: topicShort[topic],
      helper: `${topicHelpers[topic]} 核心范围：${helperDetail}。`,
      sourceType: "inTextbook",
      sourceLabel: "课内教材",
      curriculum: curriculumFor(grade, topic, {
        unit: label,
        questionTypes: ["现象判断", "实验设计", "证据推理", "概念填空"]
      }),
      questionTypes: ["现象判断", "实验设计", "证据推理", "概念填空"]
    };
  }

  const points = grades.flatMap((grade) => {
    const base = ["life", "matter", "earth", "engineering", "inquiry"].map((topic) => createPoint(grade, topic));
    const unitPoints = (curriculumData.grades?.[grade]?.terms || []).flatMap((term, termIndex) =>
      (term.units || []).map((unit, unitIndex) => {
        const topic = ["life", "matter", "earth", "engineering", "inquiry", "matter"][unitIndex % 6];
        const knowledge = unit.knowledge || {};
        return {
          id: `s${grade}-unit-${termIndex + 1}-${unitIndex + 1}`,
          subject: "science",
          grade,
          topic,
          label: `${unit.title} 同步探究`,
          short: topicShort[topic],
          helper: `${unit.title}：${[...(knowledge.concepts || []), ...(knowledge.inquiry || [])].slice(0, 6).join("、")}。`,
          sourceType: "inTextbook",
          sourceLabel: "课内教材",
          curriculum: curriculumFor(grade, topic, {
            term: term.name,
            unit: unit.title,
            knowledge,
            questionTypes: ["现象判断", "实验设计", "证据推理", "概念填空"]
          }),
          questionTypes: ["现象判断", "实验设计", "证据推理", "概念填空"]
        };
      })
    );
    return [...base, ...unitPoints];
  });

  const pointMap = Object.fromEntries(points.map((point) => [point.id, point]));
  const pointsByGrade = Object.fromEntries(grades.map((grade) => [grade, points.filter((point) => point.grade === grade)]));
  const pointsByTopic = Object.fromEntries(Object.keys(topicLabels).map((topic) => [topic, points.filter((point) => point.topic === topic)]));

  window.MathCampScienceQuestionBank = {
    subject: "science",
    grades,
    gradeNames,
    causes,
    points,
    pointMap,
    pointsByGrade,
    pointsByTopic,
    curriculumProfile,
    topicLabels
  };
})();
