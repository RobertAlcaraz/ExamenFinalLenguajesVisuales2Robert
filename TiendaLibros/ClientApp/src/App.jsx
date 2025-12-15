import React, { useEffect, useState, useRef, useCallback } from 'react';

const defaultBooks = [
    { id: 1, title: 'El alquimista', author: 'Paulo Coelho', category: 'Ficcion', price: 9.99, cover: 'https://via.placeholder.com/120x160?text=Alquimista' },
    { id: 2, title: 'Cien años de soledad', author: 'Gabriel García Marquez', category: 'Clasicos', price: 12.5, cover: 'https://via.placeholder.com/120x160?text=Cien+Años' },
    { id: 3, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Divulgacion', price: 15.0, cover: 'https://via.placeholder.com/120x160?text=Sapiens' }
];

// **1. Anti-Caching:** Asegura que la llamada a la API sea única.
async function fetchJson(url) {
    const cacheBusterUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + new Date().getTime();

    const res = await fetch(cacheBusterUrl, {
        cache: 'no-store'
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

function normalizeString(s) {
    if (!s) return '';
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function App() {
    const [books, setBooks] = useState([]);
    const [allBooks, setAllBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('Todas');
    const [cart, setCart] = useState({});

    // **2. NUEVO ESTADO:** Contador para forzar la actualización de la lista
    const [booksVersion, setBooksVersion] = useState(0);

    const pollingRef = useRef(null);
    const isMounted = useRef(true);

    const loadBooks = useCallback(async () => {
        try {
            const data = await fetchJson('/api/books');
            const normalized = (Array.isArray(data) ? data : []).map(o => {
                const book = {
                    id: o.id ?? o.Id,
                    title: o.title ?? o.Title ?? '',
                    author: o.author ?? o.Author ?? '',
                    category: o.category ?? o.Category ?? '',
                    price: Number(o.price ?? o.Price ?? 0),
                    // Aseguramos un placeholder si el cover es "string" o nulo
                    cover: (o.cover === "string" || !o.cover) ? `https://via.placeholder.com/120x160?text=${o.title || 'Libro'}` : o.cover,
                };
                book.searchTitle = normalizeString(book.title);
                return book;
            });

            if (!isMounted.current) return;

            // Actualiza la lista completa
            setAllBooks(normalized);
            setCategories(['Todas', ...Array.from(new Set(normalized.map(b => b.category))).filter(Boolean)]);

            // **3. INCREMENTO DE VERSIÓN:** Fuerza la ejecución del useEffect de filtro
            setBooksVersion(v => v + 1);

            return true;
        } catch (error) {
            console.error("Error al cargar libros desde la API:", error);
            const local = defaultBooks.map(b => ({ ...b, searchTitle: normalizeString(b.title) }));

            if (!isMounted.current) return false;

            setAllBooks(local);
            setCategories(['Todas', ...Array.from(new Set(local.map(b => b.category))).filter(Boolean)]);
            setBooksVersion(v => v + 1);

            return false;
        }
    }, []);

    // 1. useEffect: Carga inicial y Polling
    useEffect(() => {
        isMounted.current = true;
        loadBooks();

        pollingRef.current = window.setInterval(() => {
            loadBooks();
        }, 5000);

        function handleVisibility() {
            if (document.visibilityState === 'visible') loadBooks();
        }
        function handleFocus() {
            loadBooks();
        }
        window.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleFocus);

        return () => {
            isMounted.current = false;
            if (pollingRef.current !== null) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            window.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadBooks]);

    // **4. useEffect de Filtrado:** Ahora depende de booksVersion
    useEffect(() => {
        // console.log(`Aplicando filtros. Versión: ${booksVersion}, Libros cargados: ${allBooks.length}`); 
        const qnorm = normalizeString(query.trim());
        let result = allBooks;
        if (qnorm) result = result.filter(b => (b.searchTitle || '').includes(qnorm));
        if (category && category !== 'Todas') result = result.filter(b => b.category === category);
        setBooks(result);
    }, [query, category, allBooks, booksVersion]); // booksVersion añadido aquí

    function addToCart(book) {
        setCart(prev => {
            const ex = prev[book.id];
            return { ...prev, [book.id]: { book, qty: ex ? ex.qty + 1 : 1 } };
        });
    }

    function removeFromCart(id) {
        setCart(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    }

    function updateQty(id, qty) {
        if (qty <= 0) { removeFromCart(id); return; }
        setCart(prev => ({ ...prev, [id]: { ...prev[id], qty } }));
    }

    function handleQueryChange(e) {
        const input = e.target;
        const newVal = input.value;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        setQuery(newVal);

        requestAnimationFrame(() => {
            const el = document.getElementById('searchInput');
            if (!el) return;
            try {
                el.selectionStart = start;
                el.selectionEnd = end;
                el.focus();
            } catch (_) { }
        });
    }

    const Filters = () => (
        <div className="filters">
            <input
                id="searchInput"
                autoFocus
                autoComplete="off"
                placeholder="Buscar por titulo..."
                value={query}
                onChange={handleQueryChange}
            />
            <select value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={loadBooks} style={{ marginLeft: 8 }}>Refrescar</button>
        </div>
    );

    const BookCard = ({ book }) => (
        <div className="card">
            <img src={book.cover} alt={book.title} />
            <div className="card-body">
                <h3>{book.title}</h3>
                <div className="author">{book.author}</div>
                <div className="small">{book.category}</div>
                <div className="price">${Number(book.price).toFixed(2)}</div>
                <button onClick={() => addToCart(book)}>Agregar al carrito</button>
            </div>
        </div>
    );

    const BookList = () => {
        if (!books || books.length === 0) return <p className="empty">No se encontraron libros.</p>;
        return (
            <div className="book-grid">
                {books.map(b => <BookCard key={b.id} book={b} />)}
            </div>
        );
    };

    const Cart = () => {
        const list = Object.values(cart);
        const total = list.reduce((s, it) => s + it.book.price * it.qty, 0);
        return (
            <aside className="cart">
                <h2>Carrito</h2>
                {list.length === 0 ? <p>Carrito vacio</p> : (
                    <>
                        <ul>
                            {list.map(it => (
                                <li key={it.book.id}>
                                    <div className="cart-item">
                                        <div>
                                            <strong>{it.book.title}</strong>
                                            <div className="small">{it.book.author}</div>
                                            <div className="small">${Number(it.book.price).toFixed(2)}</div>
                                        </div>
                                        <div className="cart-controls">
                                            <input type="number" min="1" value={it.qty} onChange={e => updateQty(it.book.id, Number(e.target.value))} />
                                            <button onClick={() => removeFromCart(it.book.id)}>Eliminar</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="total">Total: ${total.toFixed(2)}</div>
                    </>
                )}
            </aside>
        );
    };

    return (
        <div className="container">
            <header><h1>Tienda de libros</h1></header>
            <div className="top-row">
                <Filters />
                <Cart />
            </div>
            <BookList />
        </div>
    );
}