import React from 'react';

export default function Filters({ query, setQuery, category, setCategory, categories }) {
    return (
        <div className="filters">
            <input placeholder="Buscar por título..." value={query} onChange={e => setQuery(e.target.value)} />
            <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Todas">Todas</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
    );
}