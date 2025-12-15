using System.Text.Json;
using TiendaLibros.Models;
using Microsoft.AspNetCore.Hosting;

namespace TiendaLibros.Data;

public class BooksRepository
{
    private readonly string _filePath;
    private readonly object _lock = new();

    public BooksRepository(IWebHostEnvironment env)
    {
        _filePath = Path.Combine(env.ContentRootPath, "Data", "books.json");
        var dir = Path.GetDirectoryName(_filePath);
        if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
        if (!File.Exists(_filePath)) File.WriteAllText(_filePath, "[]");
    }

    public List<Book> GetAll()
    {
        lock (_lock)
        {
            var json = File.ReadAllText(_filePath);
            return JsonSerializer.Deserialize<List<Book>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Book>();
        }
    }

    public Book? GetById(int id) => GetAll().FirstOrDefault(b => b.Id == id);

    public Book Add(Book book)
    {
        lock (_lock)
        {
            var list = GetAll();
            var nextId = list.Any() ? list.Max(b => b.Id) + 1 : 1;
            book.Id = nextId;
            list.Add(book);
            Save(list);
            return book;
        }
    }

    public bool Update(Book book)
    {
        lock (_lock)
        {
            var list = GetAll();
            var idx = list.FindIndex(b => b.Id == book.Id);
            if (idx == -1) return false;
            list[idx] = book;
            Save(list);
            return true;
        }
    }

    public bool Delete(int id)
    {
        lock (_lock)
        {
            var list = GetAll();
            var removed = list.RemoveAll(b => b.Id == id) > 0;
            if (removed) Save(list);
            return removed;
        }
    }

    private void Save(List<Book> list)
    {
        var json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_filePath, json);
    }
}