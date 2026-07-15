const store = new Map()

export function cached(key, ttlMs, fetcher) {
  const entry = store.get(key)
  if (entry && Date.now() < entry.expires) return Promise.resolve(entry.data)
  return fetcher().then((data) => {
    store.set(key, { data, expires: Date.now() + ttlMs })
    return data
  })
}

export function invalidate(key) {
  if (key) store.delete(key)
  else store.clear()
}
