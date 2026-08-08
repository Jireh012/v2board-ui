# Commit Message Convention

> 本仓库提交消息使用 **Conventional Commits + 中文**。Phase 3.4 起草 commit 时必须遵守。

---

## Format

```text
<type>(<scope>): <摘要>

<正文>
```

| 段 | 要求 |
|----|------|
| `type` | 小写英文：`feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `perf` 等 |
| `scope` | 小写英文短标识（模块/域），如 `ui`、`admin`、`plan`、`auth` |
| 摘要 | **中文**，一句话说明「做了什么 / 为何」，不以句号结尾；建议 ≤ 50 字 |
| 正文 | **中文**，空一行后写；补充动机、兼容性、影响面；可多行 |

HEREDOC 示例：

```bash
git commit -m "$(cat <<'EOF'
feat(plan): 套餐页支持优惠码与周期锁定

下单携带 coupon_code；allow_new_period 关闭时禁止另选周期。
EOF
)"
```

---

## Type 选用

| type | 何时用 |
|------|--------|
| `feat` | 新能力或用户可感知行为 |
| `fix` | 修复错误 / 未生效配置 |
| `docs` | 仅文档或 `.trellis/spec` |
| `refactor` | 无行为变化的结构调整 |
| `test` | 仅测试 |
| `chore` | 构建、杂项、工具链 |
| `perf` | 性能 |

---

## Good / Bad

#### Good

```text
feat(admin): 开通清零改为开关文案

新购/续费/变更事件 ID 输入改为 Toggle，键名仍为 *_event_id。
```

```text
fix(dashboard): 按提前天数显示即将到期

读取 getSubscribe.show_subscribe_expire；未过期且剩余天数 ≤ N 时展示徽章。
```

#### Bad

```text
完善套餐下单与订阅展示
```

缺 `type(scope):` 前缀。

```text
feat(ui): polish subscribe badge
```

摘要/正文应用中文（scope/type 保持英文）。

---

## Rules

1. 一个逻辑变更一个 commit；勿把无关改动塞进同一条。
2. 起草前可 `git log --oneline -5` 对照 scope 命名，但**格式以本文为准**（中文正文优先于历史英文习惯）。
3. 勿提交 `.env.development`、密钥或 `tsconfig.tsbuildinfo` 一类产物。
4. Trellis 工具链噪音默认不进业务 commit，除非本次就是改 Trellis。
