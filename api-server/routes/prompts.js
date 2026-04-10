/**
 * DA Key 核心接口：返回构建好的 Prompt
 *
 * 调用方通过 DA Key 获取分析框架 Prompt，
 * 自行携带图片 + 自己的 LLM Key 请求 LLM，服务方零费用。
 *
 * POST /api/prompts/analyze   获取四维分析 Prompt
 * POST /api/prompts/rewrite   获取维度重写 Prompt
 */

import { Router } from 'express';
import { buildExpertPrompts, buildRewritePrompt } from '../prompts.js';

const router = Router();

const VALID_MARKET_MODES = ['cn', 'global', 'auto'];
const VALID_MODES = ['single', 'multiple'];
const VALID_TABS = ['overview', 'business', 'ux', 'ui'];

// POST /api/prompts/analyze
router.post('/analyze', (req, res) => {
  const { mode = 'single', market_mode = 'auto', image_count = 1 } = req.body;

  if (!VALID_MODES.includes(mode))
    return res.status(400).json({ success: false, error: { code: 'INVALID_MODE', message: `mode 须为 ${VALID_MODES.join(' | ')}` } });
  if (!VALID_MARKET_MODES.includes(market_mode))
    return res.status(400).json({ success: false, error: { code: 'INVALID_MARKET_MODE', message: `market_mode 须为 ${VALID_MARKET_MODES.join(' | ')}` } });
  if (typeof image_count !== 'number' || image_count < 1 || image_count > 4)
    return res.status(400).json({ success: false, error: { code: 'INVALID_IMAGE_COUNT', message: 'image_count 须为 1～4 的整数' } });

  const isMulti = mode === 'multiple' && image_count > 1;
  const systemPrompts = buildExpertPrompts(isMulti, market_mode);

  const buildUserMessage = (tabKey) => {
    const prefix = isMulti
      ? Array.from({ length: image_count }, (_, i) => `这是 图${i + 1}:`).join('\n') + '\n\n'
      : '';
    return `${prefix}【第一步：页面类型识别（内部推演，不输出）】\n请先判断页面类型，自动切换对应行业最高标准展开分析。\n\n【第二步：核心痛点推演（内部推演，不输出）】\n确定最严重的3个问题及专业理论依据。\n\n【第三步：输出报告】\n必须以 \`===TAB_${tabKey.toUpperCase()}===\` 作为第一行，严格按 system prompt 的 Markdown 骨架填充，语言专业犀利！`;
  };

  const prompts = {};
  for (const tab of VALID_TABS) {
    prompts[tab] = { system: systemPrompts[tab], user: buildUserMessage(tab) };
  }

  res.json({
    success: true,
    data: {
      prompts,
      usage: {
        desc: '将各 tab 的 system/user 组装成 messages，追加图片 Base64 后发给你自己的 LLM（需自带 LLM Key）',
        example: {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: '{{prompts.overview.system}}' },
            { role: 'user', content: [
              { type: 'text', text: '{{prompts.overview.user}}' },
              { type: 'image_url', image_url: { url: 'data:image/png;base64,{{BASE64}}' } },
            ]},
          ],
          temperature: 0.3,
          stream: true,
        },
      },
    },
  });
});

// POST /api/prompts/rewrite
router.post('/rewrite', (req, res) => {
  const { tab, current_content, instruction, mode = 'single', image_count = 1 } = req.body;

  if (!tab || !VALID_TABS.includes(tab))
    return res.status(400).json({ success: false, error: { code: 'INVALID_TAB', message: `tab 须为 ${VALID_TABS.join(' | ')}` } });
  if (!current_content)
    return res.status(400).json({ success: false, error: { code: 'MISSING_CURRENT_CONTENT', message: 'current_content 不能为空' } });
  if (!instruction)
    return res.status(400).json({ success: false, error: { code: 'MISSING_INSTRUCTION', message: 'instruction 不能为空' } });

  const isMulti = mode === 'multiple' && image_count > 1;
  const userPrompt = buildRewritePrompt(tab, current_content, instruction, isMulti);

  res.json({
    success: true,
    data: {
      tab,
      prompt: { user: userPrompt },
      usage: {
        desc: '将 prompt.user 作为 user message 文本，追加图片后发给你自己的 LLM',
        example: {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: [
            { type: 'text', text: '{{prompt.user}}' },
            { type: 'image_url', image_url: { url: 'data:image/png;base64,{{BASE64}}' } },
          ]}],
          temperature: 0.7,
          stream: true,
        },
      },
    },
  });
});

export default router;