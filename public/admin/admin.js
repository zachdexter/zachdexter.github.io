// Admin panel — commits About photo / Lately content edits straight to the
// `content` branch via GitHub's Contents API, called directly from the browser.
// This is a lightweight deterrent, not real security: change ADMIN_PASSWORD
// below to your own value. The actual write permission is gated by the GitHub
// token you paste in on the next screen, which only you should ever hold.
const ADMIN_PASSWORD = 'fartfart'

const OWNER = 'zachdexter'
const REPO = 'zachdexter.github.io'
const BRANCH = 'content'
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`

const TOKEN_KEY = 'admin_gh_pat'

let token = null
let aboutEntries = []   // [{ filename, caption, date, sha, isNew, file, previewUrl, markedDelete }]
let latelyData = null

// ── GitHub API helpers ──────────────────────────────────────────────────────

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    ...extra,
  }
}

async function ghGetFile(path) {
  const res = await fetch(`${API_BASE}/${path}?ref=${BRANCH}`, { headers: authHeaders() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

async function ghPutFile(path, base64Content, sha, message) {
  const body = { message, content: base64Content, branch: BRANCH }
  if (sha) body.sha = sha
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function ghDeleteFile(path, sha, message) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'DELETE',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  })
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))))
}

// ── Image resize helper ──────────────────────────────────────────────────────

function resizeImageToBase64(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim }
          else { width = Math.round(width * maxDim / height); height = maxDim }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function sanitizeFilename(name) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-')
  return `${base}-${Date.now()}.jpg`
}

// ── Screen switching ─────────────────────────────────────────────────────────

function show(id) {
  ['gate', 'token-screen', 'app'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id)
  })
}

function setStatus(el, text, kind) {
  el.textContent = text
  el.className = 'status' + (kind ? ` ${kind}` : '')
}

// ── About tab ────────────────────────────────────────────────────────────────

async function loadAbout() {
  const file = await ghGetFile('about.json')
  const entries = file ? JSON.parse(base64ToUtf8(file.content)) : []
  aboutEntries = entries.map(e => ({ ...e, sha: null, isNew: false, file: null, previewUrl: null, markedDelete: false }))
  renderAbout()
}

function renderAbout() {
  const grid = document.getElementById('about-grid')
  grid.innerHTML = ''
  aboutEntries.forEach((entry, i) => {
    const card = document.createElement('div')
    card.className = 'photo-card' + (entry.isNew ? ' pending' : '') + (entry.markedDelete ? ' marked-delete' : '')
    const imgSrc = entry.previewUrl || `${RAW_BASE}/images/about/${entry.filename}`
    card.innerHTML = `
      <img src="${imgSrc}" alt="" />
      <div class="fields">
        <input type="text" class="caption-input" placeholder="Caption" value="${entry.caption || ''}" />
        <input type="text" class="date-input" placeholder="Date (e.g. Feb 2026)" value="${entry.date || ''}" />
        <div class="filename">${entry.filename}</div>
        <button type="button" class="remove-btn">${entry.markedDelete ? 'Undo delete' : 'Delete'}</button>
      </div>
    `
    card.querySelector('.caption-input').addEventListener('input', (e) => { entry.caption = e.target.value })
    card.querySelector('.date-input').addEventListener('input', (e) => { entry.date = e.target.value })
    card.querySelector('.remove-btn').addEventListener('click', () => {
      entry.markedDelete = !entry.markedDelete
      renderAbout()
    })
    grid.appendChild(card)
  })
}

async function handleAboutFiles(fileList) {
  for (const file of Array.from(fileList)) {
    const filename = sanitizeFilename(file.name)
    aboutEntries.push({
      filename,
      caption: '',
      date: '',
      sha: null,
      isNew: true,
      file,
      previewUrl: URL.createObjectURL(file),
      markedDelete: false,
    })
  }
  renderAbout()
}

async function saveAbout() {
  const statusEl = document.getElementById('about-status')
  const btn = document.getElementById('save-about-btn')
  btn.disabled = true
  setStatus(statusEl, 'Saving…')
  try {
    // Upload new images
    for (const entry of aboutEntries) {
      if (entry.isNew && entry.file) {
        const base64 = await resizeImageToBase64(entry.file)
        await ghPutFile(`images/about/${entry.filename}`, base64, null, `admin: add photo ${entry.filename}`)
      }
    }
    // Delete removed images
    for (const entry of aboutEntries.filter(e => e.markedDelete && !e.isNew)) {
      const existing = await ghGetFile(`images/about/${entry.filename}`)
      if (existing) {
        await ghDeleteFile(`images/about/${entry.filename}`, existing.sha, `admin: delete photo ${entry.filename}`)
      }
    }
    // Build final entry list (drop deleted, drop admin-only fields)
    const finalEntries = aboutEntries
      .filter(e => !e.markedDelete)
      .map(e => ({ filename: e.filename, caption: e.caption || '', date: e.date || null }))

    const jsonFile = await ghGetFile('about.json')
    await ghPutFile(
      'about.json',
      utf8ToBase64(JSON.stringify(finalEntries, null, 2)),
      jsonFile ? jsonFile.sha : null,
      'admin: update about photos'
    )

    setStatus(statusEl, 'Saved ✓', 'ok')
    await loadAbout()
  } catch (err) {
    console.error(err)
    setStatus(statusEl, `Error: ${err.message}`, 'err')
  } finally {
    btn.disabled = false
  }
}

// ── Lately tab ───────────────────────────────────────────────────────────────

async function loadLately() {
  const file = await ghGetFile('lately.json')
  latelyData = file ? JSON.parse(base64ToUtf8(file.content)) : {
    cassette: {}, tv: {}, book: {}, photos: [], game: {},
  }
  renderLately()
}

function fieldRow(label, value, onChange) {
  const wrap = document.createElement('div')
  wrap.className = 'lately-field'
  wrap.innerHTML = `<label>${label}</label>`
  const isLong = label.toLowerCase().includes('description')
  const input = document.createElement(isLong ? 'textarea' : 'input')
  if (!isLong) input.type = 'text'
  input.value = value || ''
  input.addEventListener('input', (e) => onChange(e.target.value))
  wrap.appendChild(input)
  return wrap
}

function renderLately() {
  const root = document.getElementById('lately-form')
  root.innerHTML = ''

  const tvSection = document.createElement('div')
  tvSection.className = 'lately-section'
  tvSection.innerHTML = '<h2>TV</h2>'
  tvSection.appendChild(fieldRow('Title', latelyData.tv?.title, v => latelyData.tv.title = v))
  tvSection.appendChild(fieldRow('Type', latelyData.tv?.type, v => latelyData.tv.type = v))
  tvSection.appendChild(fieldRow('Image filename', latelyData.tv?.image, v => latelyData.tv.image = v))
  tvSection.appendChild(fieldRow('Description', latelyData.tv?.description, v => latelyData.tv.description = v))
  root.appendChild(tvSection)

  const bookSection = document.createElement('div')
  bookSection.className = 'lately-section'
  bookSection.innerHTML = '<h2>Book</h2>'
  bookSection.appendChild(fieldRow('Title', latelyData.book?.title, v => latelyData.book.title = v))
  bookSection.appendChild(fieldRow('Author', latelyData.book?.author, v => latelyData.book.author = v))
  bookSection.appendChild(fieldRow('Image filename', latelyData.book?.image, v => latelyData.book.image = v))
  bookSection.appendChild(fieldRow('Description', latelyData.book?.description, v => latelyData.book.description = v))
  root.appendChild(bookSection)

  const gameSection = document.createElement('div')
  gameSection.className = 'lately-section'
  gameSection.innerHTML = '<h2>Game</h2>'
  gameSection.appendChild(fieldRow('Title', latelyData.game?.title, v => latelyData.game.title = v))
  gameSection.appendChild(fieldRow('Platform', latelyData.game?.platform, v => latelyData.game.platform = v))
  gameSection.appendChild(fieldRow('Status', latelyData.game?.status, v => latelyData.game.status = v))
  gameSection.appendChild(fieldRow('Image filename', latelyData.game?.image, v => latelyData.game.image = v))
  gameSection.appendChild(fieldRow('Description', latelyData.game?.description, v => latelyData.game.description = v))
  root.appendChild(gameSection)

  const photosSection = document.createElement('div')
  photosSection.className = 'lately-section'
  photosSection.innerHTML = '<h2>Where I\'ve Been (photos)</h2>'
  const photosList = document.createElement('div')
  photosSection.appendChild(photosList)
  const addPhotoBtn = document.createElement('button')
  addPhotoBtn.type = 'button'
  addPhotoBtn.className = 'upload-btn'
  addPhotoBtn.textContent = '+ Add photo entry'
  addPhotoBtn.addEventListener('click', () => {
    latelyData.photos.push({ image: '', caption: '', date: '', location: '' })
    renderLately()
  })
  photosSection.appendChild(addPhotoBtn)
  root.appendChild(photosSection)

  latelyData.photos.forEach((p, i) => {
    const row = document.createElement('div')
    row.className = 'lately-photo-row'
    const preview = p.image ? `${RAW_BASE}/images/lately/${p.image}` : ''
    row.innerHTML = `
      <img src="${preview}" alt="" />
      <input type="text" placeholder="image filename" value="${p.image || ''}" data-field="image" />
      <input type="text" placeholder="caption" value="${p.caption || ''}" data-field="caption" />
      <input type="text" placeholder="location" value="${p.location || ''}" data-field="location" />
      <button type="button" class="remove-btn">Remove</button>
    `
    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', (e) => { p[e.target.dataset.field] = e.target.value })
    })
    row.querySelector('.remove-btn').addEventListener('click', () => {
      latelyData.photos.splice(i, 1)
      renderLately()
    })
    photosList.appendChild(row)
  })
}

async function saveLately() {
  const statusEl = document.getElementById('lately-status')
  const btn = document.getElementById('save-lately-btn')
  btn.disabled = true
  setStatus(statusEl, 'Saving…')
  try {
    const jsonFile = await ghGetFile('lately.json')
    await ghPutFile(
      'lately.json',
      utf8ToBase64(JSON.stringify(latelyData, null, 2)),
      jsonFile ? jsonFile.sha : null,
      'admin: update lately content'
    )
    setStatus(statusEl, 'Saved ✓', 'ok')
  } catch (err) {
    console.error(err)
    setStatus(statusEl, `Error: ${err.message}`, 'err')
  } finally {
    btn.disabled = false
  }
}

// ── Wiring ───────────────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const tab = btn.dataset.tab
      document.getElementById('about-tab').classList.toggle('hidden', tab !== 'about')
      document.getElementById('lately-tab').classList.toggle('hidden', tab !== 'lately')
    })
  })
}

async function initApp() {
  initTabs()
  document.getElementById('about-file-input').addEventListener('change', (e) => handleAboutFiles(e.target.files))
  document.getElementById('save-about-btn').addEventListener('click', saveAbout)
  document.getElementById('save-lately-btn').addEventListener('click', saveLately)
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY)
    location.reload()
  })
  show('app')
  try {
    await Promise.all([loadAbout(), loadLately()])
  } catch (err) {
    console.error(err)
    alert(`Failed to load content — check your token has Contents read/write access to this repo.\n\n${err.message}`)
  }
}

document.getElementById('password-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const val = document.getElementById('password-input').value
  if (val === ADMIN_PASSWORD) {
    token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      initApp()
    } else {
      show('token-screen')
    }
  } else {
    document.getElementById('gate-error').textContent = 'Incorrect password.'
  }
})

document.getElementById('token-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const val = document.getElementById('token-input').value.trim()
  if (!val) {
    document.getElementById('token-error').textContent = 'Please paste a token.'
    return
  }
  token = val
  localStorage.setItem(TOKEN_KEY, val)
  initApp()
})
