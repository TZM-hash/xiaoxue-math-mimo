(function () {
  "use strict";

  const curriculumProfile = {
    id: "hangzhou-primary-science",
    region: "浙江省杭州市",
    textbook: "小学科学（教科版/浙江常用教材能力线）",
    publisher: "教育科学出版社",
    sourceNote: "按杭州小学常用科学教材的一至六年级主题线组织，题目材料使用原创观察和实验情境。",
    rolloutNote: "覆盖 1-6 年级可自动判分题型，优先训练观察、实验、证据推理和核心概念。"
  };

  const sourceLabels = {
    inTextbook: "课内教材",
    inquiryLine: "探究能力线"
  };

  const grades = {
    1: {
      focus: ["植物观察", "身边材料", "天气变化", "简单工程", "记录比较"],
      terms: [
        {
          name: "一年级上册",
          units: [
            { title: "植物有生命", knowledge: { concepts: ["根", "茎", "叶", "生长"], inquiry: ["观察", "记录", "比较"], materials: ["绿豆苗", "花盆", "尺子"] } },
            { title: "比较与测量", knowledge: { concepts: ["长短", "轻重", "多少"], inquiry: ["用工具测量", "按标准比较"], materials: ["纸带", "积木", "天平"] } },
            { title: "天气每天变", knowledge: { concepts: ["晴", "雨", "风", "温度"], inquiry: ["连续记录", "读天气符号"], materials: ["天气表", "温度计", "风向标"] } }
          ]
        },
        {
          name: "一年级下册",
          units: [
            { title: "动物和植物", knowledge: { concepts: ["共同特征", "生活需要", "栖息地"], inquiry: ["分类", "观察细节"], materials: ["校园植物", "蜗牛", "图片卡"] } },
            { title: "身边的材料", knowledge: { concepts: ["纸", "塑料", "金属", "用途"], inquiry: ["比较性质", "选择材料"], materials: ["纸杯", "塑料勺", "铁夹"] } },
            { title: "做一个小结构", knowledge: { concepts: ["稳定", "支撑", "连接"], inquiry: ["设计", "测试", "改进"], materials: ["吸管", "胶带", "纸板"] } }
          ]
        }
      ]
    },
    2: {
      focus: ["动物生长", "磁铁现象", "水和空气", "材料性能", "简单实验"],
      terms: [
        {
          name: "二年级上册",
          units: [
            { title: "动物的一生", knowledge: { concepts: ["出生", "生长", "繁殖", "生命周期"], inquiry: ["排序", "观察变化"], materials: ["蚕", "蝴蝶图片", "记录表"] } },
            { title: "磁铁真有趣", knowledge: { concepts: ["磁性", "磁极", "吸引", "排斥"], inquiry: ["预测", "测试", "记录"], materials: ["条形磁铁", "回形针", "铁钉"] } },
            { title: "水的观察", knowledge: { concepts: ["流动", "透明", "形状随容器改变"], inquiry: ["比较", "描述证据"], materials: ["烧杯", "水槽", "滴管"] } }
          ]
        },
        {
          name: "二年级下册",
          units: [
            { title: "空气在哪里", knowledge: { concepts: ["空气占据空间", "会流动", "可压缩"], inquiry: ["设计对比", "观察现象"], materials: ["塑料袋", "针筒", "水盆"] } },
            { title: "材料的本领", knowledge: { concepts: ["硬度", "吸水性", "柔韧性"], inquiry: ["公平比较", "选择证据"], materials: ["布", "木片", "铝箔"] } },
            { title: "搭建小桥", knowledge: { concepts: ["承重", "形状", "结构"], inquiry: ["测试承重", "改进方案"], materials: ["纸条", "硬币", "胶带"] } }
          ]
        }
      ]
    },
    3: {
      focus: ["植物生命周期", "水的三态", "空气和运动", "公平实验", "数据记录"],
      terms: [
        {
          name: "三年级上册",
          units: [
            { title: "植物的生长变化", knowledge: { concepts: ["种子", "发芽", "开花", "结果"], inquiry: ["长期观察", "变量记录"], materials: ["凤仙花", "土壤", "记录表"] } },
            { title: "水和水蒸气", knowledge: { concepts: ["蒸发", "凝结", "温度", "三态变化"], inquiry: ["观察变化", "解释现象"], materials: ["冰块", "热水", "透明杯"] } },
            { title: "空气的力量", knowledge: { concepts: ["空气占空间", "气压", "风"], inquiry: ["控制条件", "比较现象"], materials: ["气球", "纸杯", "吸管"] } }
          ]
        },
        {
          name: "三年级下册",
          units: [
            { title: "动物的生命周期", knowledge: { concepts: ["卵", "幼体", "成体", "变态"], inquiry: ["排序证据", "比较生命周期"], materials: ["蚕宝宝", "图片序列", "观察盒"] } },
            { title: "物体的运动", knowledge: { concepts: ["位置", "方向", "快慢", "距离"], inquiry: ["测量", "记录数据"], materials: ["小车", "秒表", "斜面"] } },
            { title: "科学探究方法", knowledge: { concepts: ["公平实验", "变量", "证据", "结论"], inquiry: ["提出问题", "设计实验", "分析数据"], materials: ["实验记录单", "对照组", "量杯"] } }
          ]
        }
      ]
    },
    4: {
      focus: ["植物结构", "声音和光", "岩石土壤", "电路模型", "证据解释"],
      terms: [
        {
          name: "四年级上册",
          units: [
            { title: "植物的结构", knowledge: { concepts: ["根吸水", "茎运输", "叶制造养分"], inquiry: ["解剖观察", "功能推理"], materials: ["芹菜", "红墨水", "放大镜"] } },
            { title: "声音的传播", knowledge: { concepts: ["振动", "传播介质", "音高", "音量"], inquiry: ["改变条件", "听辨比较"], materials: ["橡皮筋", "音叉", "纸杯电话"] } },
            { title: "岩石和土壤", knowledge: { concepts: ["岩石", "矿物", "颗粒", "腐殖质"], inquiry: ["观察分类", "沉降比较"], materials: ["岩石样本", "土壤", "水瓶"] } }
          ]
        },
        {
          name: "四年级下册",
          units: [
            { title: "简单电路", knowledge: { concepts: ["电源", "导线", "用电器", "闭合回路"], inquiry: ["搭建模型", "排查故障"], materials: ["电池", "小灯泡", "导线"] } },
            { title: "光和影", knowledge: { concepts: ["光源", "直线传播", "影子", "反射"], inquiry: ["改变距离", "比较影长"], materials: ["手电筒", "屏幕", "小木块"] } },
            { title: "设计照明装置", knowledge: { concepts: ["开关", "导体", "绝缘体", "安全"], inquiry: ["设计", "测试", "迭代"], materials: ["开关", "铜片", "纸盒"] } }
          ]
        }
      ]
    },
    5: {
      focus: ["生态系统", "热和溶解", "地球表面", "机械结构", "数据证据"],
      terms: [
        {
          name: "五年级上册",
          units: [
            { title: "生物与环境", knowledge: { concepts: ["食物链", "栖息地", "适应", "生态平衡"], inquiry: ["建模", "分析关系"], materials: ["食物网卡片", "校园地图", "记录表"] } },
            { title: "热的传递", knowledge: { concepts: ["传导", "对流", "辐射", "保温"], inquiry: ["测温", "控制变量"], materials: ["温度计", "金属勺", "保温杯"] } },
            { title: "水能溶解物质", knowledge: { concepts: ["溶解", "过滤", "饱和", "快慢"], inquiry: ["公平实验", "数据比较"], materials: ["食盐", "白糖", "滤纸"] } }
          ]
        },
        {
          name: "五年级下册",
          units: [
            { title: "地球表面的变化", knowledge: { concepts: ["风化", "侵蚀", "沉积", "地形"], inquiry: ["模拟实验", "证据解释"], materials: ["沙盘", "水壶", "石块"] } },
            { title: "简单机械", knowledge: { concepts: ["杠杆", "轮轴", "滑轮", "省力"], inquiry: ["测量力", "比较方案"], materials: ["尺子", "钩码", "滑轮"] } },
            { title: "解决真实问题", knowledge: { concepts: ["需求", "约束", "原型", "评价"], inquiry: ["工程设计", "测试改进"], materials: ["纸板", "橡皮筋", "评价表"] } }
          ]
        }
      ]
    },
    6: {
      focus: ["人体系统", "能量转换", "宇宙空间", "技术系统", "模型推理"],
      terms: [
        {
          name: "六年级上册",
          units: [
            { title: "人体和健康", knowledge: { concepts: ["呼吸", "循环", "消化", "协同"], inquiry: ["建立模型", "解释关系"], materials: ["人体模型", "脉搏记录", "流程图"] } },
            { title: "能量和转换", knowledge: { concepts: ["电能", "光能", "热能", "机械能"], inquiry: ["追踪能量", "比较效率"], materials: ["小电机", "太阳能板", "灯泡"] } },
            { title: "太阳系大家庭", knowledge: { concepts: ["太阳", "行星", "公转", "自转"], inquiry: ["模型模拟", "尺度比较"], materials: ["球体模型", "灯", "轨道图"] } }
          ]
        },
        {
          name: "六年级下册",
          units: [
            { title: "生物多样性", knowledge: { concepts: ["分类", "遗传", "变异", "保护"], inquiry: ["比较特征", "整理证据"], materials: ["生物卡片", "检索表", "校园样方"] } },
            { title: "地球、月球和太阳", knowledge: { concepts: ["月相", "昼夜", "季节", "引力"], inquiry: ["模型解释", "连续观察"], materials: ["月相图", "地球仪", "手电筒"] } },
            { title: "工程系统优化", knowledge: { concepts: ["系统", "反馈", "效率", "可靠性"], inquiry: ["评价指标", "优化设计"], materials: ["流程图", "传感器卡", "测试表"] } }
          ]
        }
      ]
    }
  };

  window.MathCampScienceCurriculumData = {
    curriculumProfile,
    sourceLabels,
    grades
  };
})();
