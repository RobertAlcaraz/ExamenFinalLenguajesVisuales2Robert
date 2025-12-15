import React from 'react';

export default function BookCard({ book, onAdd }) {
    return (
  
      < div className = "card" >
  
        < img src ={ book.cover ?? 'https://via.placeholder.com/120x160?text=Libro'}
    alt ={ book.title} />
  
        < div className = "card-body" >
  
          < h3 >{ book.title}</ h3 >
  
          < p className = "author" >{ book.author}</ p >
  
          < p className = "category" >{ book.category}</ p >
  
          < p className = "price" >${ Number(book.price).toFixed(2)}</ p >
  
          < button onClick ={ () => onAdd(book)}> Añadir al carrito</ button >
  
        </ div >
  
      </ div >
  );
}