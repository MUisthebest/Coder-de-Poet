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
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Auth Service API", 
        Version = "v1",
        Description = "Authentication and Authorization Service API"
    });

    // Thêm JWT Authentication support trong Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();
builder.Service.AddHealthChecks();

string ConvertDatabaseUrl(string url)
{
    if (string.IsNullOrEmpty(url))
    {
        throw new ArgumentException("Database URL cannot be null or empty");
    }

    // Parse connection string từ DATABASE_URL format
    var uri = new Uri(url);
    var userInfo = uri.UserInfo.Split(':');

    var username = userInfo[0];
    var password = userInfo.Length > 1 ? userInfo[1] : "";

    var database = uri.LocalPath.TrimStart('/');
    if (string.IsNullOrEmpty(database))
    {
        database = "auth_service"; // database mặc định
    }

    var port = uri.Port > 0 ? uri.Port : 5432; // PostgreSQL mặc định port 5432

    var connectionString = $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";

    Console.WriteLine($"Converted connection string: {connectionString.Replace(password, "***")}");
    return connectionString;
}

builder.Services.AddDbContext<UserDbContext>(options =>
{
    var raw = builder.Configuration["DATABASE_URL"];
    
    if (string.IsNullOrEmpty(raw))
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Neither DATABASE_URL nor DefaultConnection configuration found");
        }
        options.UseNpgsql(connectionString, 
            npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null
            ));
    }
    else
    {
        try
        {
            var conn = ConvertDatabaseUrl(raw);
            options.UseNpgsql(conn, 
                npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null
                ));
            Console.WriteLine("Using DATABASE_URL from environment with retry policy");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error converting DATABASE_URL: {ex.Message}");
            throw;
        }
    }
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

var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth Service API v1");
    c.RoutePrefix = "swagger"; // Truy cập Swagger UI tại /swagger
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.MapHealthChecks("/health");
app.UseHttpsRedirection();
app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
