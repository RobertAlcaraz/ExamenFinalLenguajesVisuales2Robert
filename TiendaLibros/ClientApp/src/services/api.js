// Sin .env: usamos rutas relativas y confiamos en el proxy de vite.config.js
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

function normalizeBook(o) {
    if (!o) return null;
    return {
        id: o.id ?? o.Id,
        title: o.title ?? o.Title ?? '',
        author: o.author ?? o.Author ?? '',
        category: o.category ?? o.Category ?? '',
        price: Number(o.price ?? o.Price ?? 0),
        cover: o.cover ?? o.Cover ?? null
    };
}

async function tryUrls(paths) {
    let lastErr = null;
    for (const p of paths) {
        try {
            console.debug('[api] intentando', p);
            const data = await fetchJson(p);
            return data;
        } catch (err) {
            console.warn('[api] fallo en', p, err);
            lastErr = err;
        }
    }
    throw lastErr ?? new Error('No se pudo obtener JSON de ninguna URL');
}

export async function getBooks(title) {
    const q = title ? `?title=${encodeURIComponent(title)}` : '';
    const paths = [
        `/api/books${q}`,                        // proxy Vite (ideal)
        `https://localhost:5001/api/books${q}`,  // dotnet https por defecto
        `http://localhost:5000/api/books${q}`    // dotnet http alternativo
    ];
    const data = await tryUrls(paths);
    if (!Array.isArray(data)) return [];
    return data.map(normalizeBook).filter(Boolean);
}

export async function getCategories() {
    const paths = [
        `/api/categories`,
        `https://localhost:5001/api/categories`,
        `http://localhost:5000/api/categories`
    ];
    const data = await tryUrls(paths);
    if (!Array.isArray(data)) return [];
    if (data.length === 0) return [];
    if (typeof data[0] === 'string') return data;
    const cats = data.map(normalizeBook).filter(Boolean).map(b => b.category);
    return Array.from(new Set(cats));
}

export async function getCategoryBooks(name) {
    const q = name ? `?name=${encodeURIComponent(name)}` : '';
    const paths = [
        `/api/categories${q}`,
        `https://localhost:5001/api/categories${q}`,
        `http://localhost:5000/api/categories${q}`
    ];
    const data = await tryUrls(paths);
    if (!Array.isArray(data)) return [];
    if (data.length === 0) return [];
    if (typeof data[0] === 'string') return [];
    return data.map(normalizeBook).filter(Boolean);
}