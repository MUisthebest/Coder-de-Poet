using System.Text;
using auth_service.Application.Security;
using auth_service.Application.Usecase.Implementation;
using auth_service.Application.Usecase.Interface;
using auth_service.Domain.Repository;
using auth_service.Infrastructure.Database;
using auth_service.Infrastructure.Repository;
using auth_service.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<UserDbContext>(options =>
{
    var conn = builder.Configuration["DATABASE_URL"];
    options.UseNpgsql(conn);
    options.LogTo(Console.WriteLine, LogLevel.Information);
});

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserUseCase, UserUseCase>();
builder.Services.AddScoped<IBcryptPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IJWTTokenProvidder, JWTTokenProvidder>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["SecretKey"];

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

var connStr = builder.Configuration["DATABASE_URL"];
try
{
    using var conn = new NpgsqlConnection(connStr);
    conn.Open();
    Console.WriteLine("Database connection established successfully.");
    conn.Close();
}
catch (Exception ex)
{
    Console.WriteLine($"Database connection failed: {ex.Message}");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
