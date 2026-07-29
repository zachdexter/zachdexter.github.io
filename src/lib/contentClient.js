// Reads editable content (About photos, Lately data) from the `content` branch,
// which the /admin panel commits to directly via the GitHub API. Kept independent
// of the build/deploy pipeline so edits show up without a rebuild.
//
// Served via jsDelivr rather than raw.githubusercontent.com: raw.githubusercontent.com's
// CDN cache ignores query strings entirely (a cache-busting `?t=` has no effect,
// so edits can take up to 5 minutes to appear). jsDelivr caches too, but admin.js
// calls jsDelivr's purge API right after each save, so edits show up in seconds.
const CONTENT_BASE_URL = 'https://cdn.jsdelivr.net/gh/zachdexter/zachdexter.github.io@content'

export function contentImageUrl(category, filename) {
  if (!filename) return null
  return `${CONTENT_BASE_URL}/images/${category}/${filename}`
}

export async function fetchContentJson(path) {
  const res = await fetch(`${CONTENT_BASE_URL}/${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.json()
}
