import parser from 'cron-parser'

/** Spring 6-field cron presets (秒 分 时 日 月 周). */
export const SPRING_CRON_PRESETS: { label: string; expr: string }[] = [
  { label: '每分钟', expr: '0 * * * * *' },
  { label: '每5分钟', expr: '0 */5 * * * *' },
  { label: '每15分钟', expr: '0 */15 * * * *' },
  { label: '每30分钟', expr: '0 */30 * * * *' },
  { label: '每小时', expr: '0 0 * * * *' },
  { label: '每2小时', expr: '0 0 */2 * * *' },
  { label: '每天0点', expr: '0 0 0 * * *' },
  { label: '每天2点', expr: '0 0 2 * * *' },
  { label: '每天12点', expr: '0 0 12 * * *' },
  { label: '每周一0点', expr: '0 0 0 * * 1' }
]

export type CronPreview =
  | { ok: true; times: Date[] }
  | { ok: false; error: string }

/**
 * Next fire times for a Spring-style 6-field cron (seconds first).
 * Supports common patterns used by this panel; complex Quartz `?` may fail client-side.
 */
export function previewSpringCron(expr: string, count = 5, from: Date = new Date()): CronPreview {
  const raw = (expr || '').trim()
  if (!raw) {
    return { ok: false, error: '请输入 Cron 表达式' }
  }
  if (raw === '-') {
    return { ok: false, error: '请用开关关闭自动同步，不要使用 -' }
  }
  const fields = raw.split(/\s+/)
  if (fields.length !== 6) {
    return { ok: false, error: '需要 Spring 六段表达式：秒 分 时 日 月 周' }
  }
  try {
    const interval = parser.parseExpression(raw, { currentDate: from })
    const times: Date[] = []
    for (let i = 0; i < count; i++) {
      times.push(interval.next().toDate())
    }
    return { ok: true, times }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || '表达式无效' }
  }
}

export function formatCronRunTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
