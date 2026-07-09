# 题库 Excel 交换格式（v1）

本文档定义喵喵学习题库统一的 **Excel（.xlsx）交换格式**。所有题库——原创、参考资料派生、以及未来的自定义/校内题库——都按此格式导出；未来导入也按同一格式。

> 用途：以后需要新增题库时，可以让大模型直接按本格式生成一份 `.xlsx`，人工核对后手动导入软件。

## 使用方式（当前已实现：导出）

在软件里进入 **学生信息 → 题库质量巡检** 卡片：

1. 用「学科 / 年级」下拉和「参考资料派生 / 原创扩展」按钮筛选要导出的范围（不选即全部）。
2. 点击 **导出题库 Excel**，浏览器/APP 会下载一个 `.xlsx` 文件。

导出的文件用 Excel、WPS 均可直接打开，中文正常显示。

## 工作表与行结构

- 单个工作簿，一个工作表：`questions`。
- **第 1 行**：表头（列名，中英对照）。
- **第 2 行**：每列的填写说明。
- **第 3 行起**：每行一道题。

## 列定义

| 列 | 列名 | 含义 | 适用题型 | 备注 |
|---|---|---|---|---|
| A | `bank 题库分类` | 来源分类 | 全部 | `原创` / `参考` / `自定义` |
| B | `grade 年级` | 年级 | 全部 | 如 `3` |
| C | `subject 学科` | 学科 | 全部 | `math` / `chinese` / `english` / `science` |
| D | `pointId 知识点ID` | 知识点标识 | 全部 | 须为软件已有知识点 ID，如 `g3-...` |
| E | `pointLabel 知识点` | 知识点可读名 | 全部 | 导出自动填充；导入可留空 |
| F | `answerType 题型` | 题目类型 | 全部 | `text`（填空/应用）/ `choice`（选择）/ `judge`（判断） |
| G | `text 题干` | 题干文字 | text / judge | 选择题留空（用 prompt） |
| H | `prompt 选择题干` | 选择题题干 | choice | 仅选择题 |
| I | `correct 正确选项` | 正确选项文字 | choice | 仅选择题 |
| J | `wrongs 干扰项` | 错误选项 | choice | 用 `\|` 分隔多个 |
| K | `answer 答案` | 标准答案 | text / judge | 判断题填 `对` / `错` |
| L | `acceptedAnswers 可接受答案` | 判对时也算对的写法 | 全部 | 用 `\|` 分隔；留空则自动取 answer/correct |
| M | `explanation 解析` | 答案解析 | 全部 | 可空 |
| N | `steps 步骤` | 解题步骤 | 全部 | 用 `\|\|`（双竖线）分隔多步 |
| O | `templateType 题型标签` | 题型/模板名 | 全部 | 如 `竖式乘法`、`看图列式` |
| P | `sourceNote 题源说明` | 题源备注 | 全部 | 可空 |
| Q | `id 题目ID` | 题目唯一 ID | 全部 | 导出带上；导入可留空（系统自动生成） |

## 分隔符约定

- **`|`（单竖线）**：同一单元格内的多个并列值，用于 `wrongs`（干扰项）和 `acceptedAnswers`（可接受答案）。
- **`||`（双竖线）**：解题步骤 `steps` 中分隔各步骤。

## 各题型必填字段

- **text（填空/应用题）**：`text`、`answer` 必填；`prompt`/`correct`/`wrongs` 留空。
- **choice（选择题）**：`prompt`、`correct`、`wrongs` 必填；`text`/`answer` 留空。
- **judge（判断题）**：`text`、`answer`（`对`/`错`）必填。

## 示例行

| bank | grade | subject | pointId | answerType | text | prompt | correct | wrongs | answer | steps |
|---|---|---|---|---|---|---|---|---|---|---|
| 原创 | 3 | math | g3-mul-two | text | 计算 12×3 = ? | | | | 36 | 列竖式\|\|逐位相乘 |
| 参考 | 3 | math | g3-mul-two | choice | | 12×3 的积是多少？ | 36 | 35\|30\|39 | | |
| 原创 | 3 | chinese | c3-... | judge | 判断：“鲸”是鱼类。 | | | | 错 | |

## 说明与限制

- 生成器与格式实现见 `js/question-bank-excel.js`，测试见 `tests/question-bank-excel.test.js`。
- **图片题（v3 已支持）**：新增 `image` 列，见下方「图片题」一节。

---

# 导入：校内自定义题库（v2 已实现）

家长可以把学校发的试卷/练习册（按上面的统一格式整理成 `.xlsx` 或 `.csv`）导入软件，形成**按批次管理**的校内题库。

## 使用方式

进入 **学生信息 → 校内题库** 卡片：

1. 选择一个 `.xlsx` 或 `.csv` 文件（批次名默认取文件名，可修改）。
2. 点击 **导入题库**。一次导入 = 一个批次（一张试卷 / 一本练习册）。
3. 导入后每个批次显示题数与导入日期，可：
   - **整批练习**：按整套卷子练习，做完出报告，错题进错题本。
   - **重命名 / 删除**。
4. 批次中**带有效知识点 ID（pointId）**的题，会自动混入日常自适应练习按知识点抽取；没有 pointId 的题只在整批练习里出现。

## 两种导入文件

- **CSV（推荐让大模型直接生成）**：纯文本，UTF-8 编码，列顺序同上表。大模型可直接输出 CSV 文本，无需代码执行，最可靠。
- **XLSX**：可从 Excel/WPS 另存，或用软件导出的文件回填。软件内置了零依赖的 xlsx 读取（自研 DEFLATE 解压 + SpreadsheetML 解析），兼容真实 Excel 的压缩与共享字符串表。

## CSV 编写要点（给大模型的提示）

- 第 1 行为表头（列名，可用纯英文如 `bank,grade,subject,pointId,answerType,text,prompt,correct,wrongs,answer,acceptedAnswers,explanation,steps,templateType,sourceNote,id`）。
- 含逗号/引号/换行的单元格用双引号包裹，内部双引号写成两个 `""`。
- `wrongs`、`acceptedAnswers` 内多个值用 `|` 分隔；`steps` 多步用 `||` 分隔。
- 每种题型必填字段见上文「各题型必填字段」。缺字段的行会被自动跳过并计数提示。

## 存储与备份

- 校内题库**仅保存在本机**：题目文本存 localStorage，图片存 IndexedDB。
- 会随 **完整存档导出/导入** 一起备份恢复（存档 JSON 里的 `customBanks` 字段，含图片 base64）。

## 图片题（拍照原题）

用于把拍照/扫描的原题图导入软件。

编写与导入步骤：

1. 在 Excel/CSV 里给图片题的行填写 **`image` 列 = 图片文件名**（如 `q1.png`）。
2. 题目类型仍用 `answerType`：
   - **有答案**（填 `answer`）：孩子看图在软件里输入答案，自动判对错，错题进错题本。
   - **无答案**（`answer` 留空）：作为**纯展示题**，只在题目详情里查看，不进作答练习。
3. 导入时：先「选择文件」选 Excel/CSV，再点「选择图片（可选）」**多选**这批题引用到的图片文件。系统按文件名自动关联。
4. 图片缺失（未选到对应文件名）不会报错，详情里会标「图片缺失」，可重新导入补齐。

说明：

- 图片以 base64 存 IndexedDB，避免撑爆 localStorage；随完整存档一起备份。
- 图片列对内置题库导出同样有效（内置图片题会导出其图片文件名）。

## 实现与测试

- 存储与练习服务：`js/custom-bank.js`
- 图片存储（IndexedDB）：`js/bank-images.js`
- 解析层（CSV/xlsx，含 image 列）：`js/question-bank-excel.js`
- 测试：`tests/custom-bank-import.test.js`

