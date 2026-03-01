// lib/rate-limit.ts
const requests = new Map<string, { count: number; time: number }>()
const checkedRequests = new WeakSet<Request>()

export async function rateLimit(req: Request) {
  if (checkedRequests.has(req)) {
    return false
  }

  checkedRequests.add(req)

  const ip = req.headers.get("x-forwarded-for") ?? "local"
  const now = Date.now()

  const record = requests.get(ip) ?? { count: 0, time: now }

  if (now - record.time > 60_000) {
    record.count = 0
    record.time = now
  }

  record.count++
  requests.set(ip, record)

  return record.count > 10 // 10 req/min
}