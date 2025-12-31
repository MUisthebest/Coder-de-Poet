using IdeService.Data;
using IdeService.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddDbContext<IdeDbContext>(options =>
{
    var cs = builder.Configuration.GetConnectionString("Default")
             ?? builder.Configuration["ConnectionStrings:Default"]
             ?? throw new InvalidOperationException("Missing ConnectionStrings:Default");

    options.UseNpgsql(cs);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://your-frontend-domain.com"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// DI for judge pipeline
builder.Services.AddSingleton<DockerRunner>();
builder.Services.AddSingleton<JudgeService>();

// Background worker (async submissions)
builder.Services.AddHostedService<SubmissionWorker>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");


app.UseHttpsRedirection();

// IMPORTANT
app.MapControllers();

app.Run();