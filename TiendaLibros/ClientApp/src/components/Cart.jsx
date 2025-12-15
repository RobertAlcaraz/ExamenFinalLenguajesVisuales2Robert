import React from 'react';

export default function Cart({ items, remove, updateQty }) {
    const list = Object.values(items);
    const total = list.reduce((s, it) => s + it.book.price * it.qty, 0);
    return (
        <aside className="cart">
            <h2>Carrito</h2>
            {list.length === 0 ? <p>Carrito vacío</p> : (
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
                                        <button onClick={() => remove(it.book.id)}>Eliminar</button>
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
}