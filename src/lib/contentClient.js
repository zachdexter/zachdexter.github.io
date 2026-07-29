// Reads editable content (About photos, Lately data) from the `content` branch,
// which the /admin panel commits to directly via the GitHub API. Kept independent
// of the build/deploy pipeline so edits show up without a rebuild.
const CONTENT_BASE_URL = 'https://raw.githubusercontent.com/zachdexter/zachdexter.github.io/content'

export function contentImageUrl(category, filename) {
  if (!filename) return null
  return `${CONTENT_BASE_URL}/images/${category}/${filename}`
}

export async function fetchContentJson(path) {
  const res = await fetch(`${CONTENT_BASE_URL}/${path}?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.json()
}
