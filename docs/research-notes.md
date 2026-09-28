# 核实资料与决策记录

资料核实：2026-09-27（美国东部当地日期）。这是产品设计所需的有限核实，不是全球法律评估、市场规模研究或买方需求验证。

## 已核实、影响设计的事实

| 事实或边界 | 对本项目的影响 | 官方资料 |
|---|---|---|
| Open to Work 可以公开，也可以只向 Recruiter 用户显示 | 普通用户能看到的人群不是全量；不能把徽章等同被裁 | [LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a507508) |
| Recruiter 提供 Open to Work 筛选，且对特定已在项目中的候选人有状态更新通知 | 有产品内能力，但本次未证实存在适用于本产品的全站“近期切换状态”公开接口；不把它设为依赖 | [Recruiter Help](https://www.linkedin.com/help/recruiter/answer/a419131/view-candidates-who-are-open-to-work-in-recruiter?lang=en) |
| LinkedIn OIDC 提供基础身份资料；文档提醒它不验证用户真实身份 | 完整履历采用用户自填／上传，不宣传“登录即导入履历”或身份已核验 | [Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2) |
| LinkedIn 用户协议限制抓取和未经授权的自动化操作 | MVP 使用用户主动输入、内容获客、人工与合作渠道；自动抓取不进入关键路径 | [LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement) |
| O*NET 提供职业、任务与工作活动等结构化数据 | 用于任务词汇与提问候选；不能证明个人做过这些工作 | [O*NET Database](https://www.onetcenter.org/database.html) |
| ESCO 提供多语言职业与技能数据 | 作为英西语分类映射参考；保留原始职称、版本与许可 | [ESCO Download](https://esco.ec.europa.eu/en/use-esco/download) |
| ILO 的职业 AI 暴露研究衡量潜在影响，不能等同已发生的失业 | 访谈不预设 AI 导致裁员，技术变化与裁员因果分开 | [ILO 研究说明](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) |
| 美国 WARN 针对符合条件的裁员与关闭事件 | 可以辅助理解事件和地区，不能视为完整个人名单 | [U.S. Department of Labor](https://www.dol.gov/agencies/eta/layoffs/warn) |
| GDPR 有用途限制、最小化与存储限制等原则 | 从开始就设计用途、字段必要性、留存和纠错 | [European Commission — Principles](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en) |
| 当以同意为依据时，需要自由、知情、具体且可撤回；同意不是唯一处理依据 | 职业服务、研究、商业报告、联系与营销分开记录，避免捆绑 | [European Commission — Legal grounds](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en) |
| 仍可重识别的假名化资料依然属于个人数据 | 删除姓名不等于匿名；研究导出需评估组合信息和自由文本 | [European Commission — Application](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/application-gdpr_en) |
| 在 CCPA 适用时，存在告知、删除、更正、销售／分享退出等义务 | 在决定主体、地区和商业用途后确认适用范围并实现相关权利 | [California Attorney General](https://www.oag.ca.gov/privacy/ccpa) |

## 已确认的创始人决定

- 第一版不做个人 enrichment，参与者自行提供 LinkedIn 链接及背景；Apollo／Clay 为未来候选来源。
- 强调直观、移动端友好以及语音输入；已形成[第一版开发规格](./development-plan.md)。
- 第一阶段最新优先级：用技能重评、优化简历和求职／AI 工具福利获客，收集职业背景、领域经验及行业问题。课程、社区和付费后续验证。
- 原始构想仍保留：对話式采集背景、真实流程、技术变化与行业痛点，未来支持 Solo Unicorn。
- 主要考虑 35–50 岁、有传统行业经验的人；希望支持美国、欧洲与西语群体。
- 早期考虑用工具额度与合作优惠补充激励；具体供应商权益待核实。
- 用户已澄清合作候选为 Jobright.ai，计划自行洽谈；本次仅纳入规划，未验证其优惠活动或建立合作。
- 本地 LLM 使用用户指定的局域网中转站；本次列出 56 个模型 ID，并验证三个基本文本调用。详情见[接入记录](./local-model-gateway.md)，清单不代表全部模型均可推理。

## 本轮新增核实

- 已通过浏览器读取 [Muse 邀请码页面](https://muse-codes.pages.dev/)。该页自称社区平台，与 Meta 无关联；页面称每码可用 30 次，余量根据反馈估算。仅确认页面内容，未验证供应商权益、官方关系或任何具体码的实际可用性，也没有复制或试兑邀请码。
- 已读取 [OpenAI 文件转写文档](https://developers.openai.com/api/docs/guides/speech-to-text)：按轮录音后转写是可用 API 路径。首选模型、账户权限、SDK 与实际成本在开发接入时再验证。
- 浏览器录音需要安全上下文和用户许可，录音格式要检测：[getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)、[MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)。本次尚未进行真机录音测试。
- 已通过 Supabase 文档工具读取表访问授权、RLS 与私有 bucket 说明；这些能力用于建议架构，未创建项目或修改数据库。Changelog 的 Markdown 地址不被网页工具支持，已改读 HTML 更新记录。第一版无旧数据库迁移，开工时仍需重新核实相关破坏性更新。

## 本文提出、尚未验证的假设

- 先聚焦物流／供应链运营与美国英语人群。
- 已有完整简历者主流程约 10–15 分钟；没有简历或选择长访谈者可能需要分次完成。
- 技能重评、可用简历和福利能带来足够的获客动力，需通过实际使用验证。
- 原先 4 周小班和课程价格实验已移至后续，首期不以实际收费为门槛。
- 首期应验证简历准确及可用性、行业问题具体性、获客成本和各类联系许可。
- 社区订阅可能有价值，但也可能更适合结课后的免费校友群。
- 后续咨询买方可能购买汇总研究；本次没有访谈买方、确认价格或证明需求。

不能把上述假设放到网站上当成已有成果。未进行用户招募、实际访谈、支付试验、供应商奖励核实或法律审查。

## 研究方法与限制

已阅读 agent-reach 技能及对应搜索／职场／网页说明。本地 `agent-reach doctor --json` 因尝试更改其用户目录权限而失败，`mcporter` 不在当前命令路径；未修改本机配置。改用网页检索和官方页面读取核实上述资料。没有采集任何具体求职者的个人资料或进行外部联系。

平台能力会变化；实现前重新核实实际账号可用功能、API 权限、供应商许可与服务条款。这里的隐私设计是工程与产品要求草案；正式开放市场时应依据实际主体、处理流程与目标司法辖区完成适用性判断。
