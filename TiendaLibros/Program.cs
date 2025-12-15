using System.IO;
using TiendaLibros.Data;
using TiendaLibros.Models;

var builder = WebApplication.CreateBuilder(args);

// Si existe ClientApp/dist lo usamos como WebRoot (producción build de la UI).
// Si no existe, se mantendrá el comportamiento por defecto (wwwroot si existe).
var contentRoot = builder.Environment.ContentRootPath;
var clientDist = Path.Combine(contentRoot, "ClientApp", "dist");
var wwwrootPath = Path.Combine(contentRoot, "wwwroot");

if (Directory.Exists(clientDist))
{
    builder.WebHost.UseWebRoot(clientDist);
}
else if (Directory.Exists(wwwrootPath))
{
    builder.WebHost.UseWebRoot(wwwrootPath);
}


// Servicios
builder.Services.AddSingleton<BooksRepository>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", p =>
        p.WithOrigins("http://localhost:5173") // origen del cliente React (Vite)
         .AllowAnyHeader()
         .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Servir archivos estáticos solo si se ha establecido WebRoot y existe
if (!string.IsNullOrEmpty(app.Environment.WebRootPath) && Directory.Exists(app.Environment.WebRootPath))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();

    // Fallback a index.html para rutas de SPA (si el directorio contiene index.html)
    var indexFile = Path.Combine(app.Environment.WebRootPath, "index.html");
    if (File.Exists(indexFile))
    {
        app.MapFallbackToFile("index.html");
    }
}
else
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("No se encontró ClientApp/dist ni wwwroot. No se sirven archivos estáticos.");
}

app.UseCors("AllowReact");

app.UseSwagger();
app.UseSwaggerUI();

// Endpoints mínimos CRUD
app.MapGet("/api/books", (BooksRepository repo, string? title) =>
{
    var books = repo.GetAll().AsEnumerable();
    if (!string.IsNullOrWhiteSpace(title))
    {
        books = books.Where(b => b.Title != null && b.Title.Contains(title, StringComparison.OrdinalIgnoreCase));
    }
    return Results.Ok(books);
});

app.MapGet("/api/books/{id:int}", (int id, BooksRepository repo) =>
{
    var book = repo.GetById(id);
    return book is null ? Results.NotFound() : Results.Ok(book);
});

app.MapGet("/api/categories", (BooksRepository repo, string? name) =>
{
    if (string.IsNullOrWhiteSpace(name))
    {
        var cats = repo.GetAll().Select(b => b.Category).Distinct().OrderBy(c => c);
        return Results.Ok(cats);
    }

    var books = repo.GetAll()
                    .Where(b => !string.IsNullOrWhiteSpace(b.Category) &&
                                b.Category.Contains(name, StringComparison.OrdinalIgnoreCase))
                    .ToList();

    return Results.Ok(books);
});

app.MapPost("/api/books", (Book book, BooksRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(book.Title)) return Results.BadRequest("Title required");
    var created = repo.Add(book);
    return Results.Created($"/api/books/{created.Id}", created);
});

app.MapPut("/api/books/{id:int}", (int id, Book book, BooksRepository repo) =>
{
    if (id != book.Id) return Results.BadRequest("Id mismatch");
    var ok = repo.Update(book);
    return ok ? Results.NoContent() : Results.NotFound();
});

app.MapDelete("/api/books/{id:int}", (int id, BooksRepository repo) =>
{
    var ok = repo.Delete(id);
    return ok ? Results.NoContent() : Results.NotFound();
});

app.Run();