import React from 'react';
import BookCard from './BookCard';

export default function BookList({ books, onAdd }) {
    if (!books || books.length === 0) return <p className="empty">No se encontraron libros.</p>;
    return (
        <div className="book-grid">
            {books.map(b => <BookCard key={b.id} book={b} onAdd={onAdd} />)}
        </div>
    );
}