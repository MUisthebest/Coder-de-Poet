using System.Text;
using auth_service.Application.Security;
using auth_service.Application.Usecase.Implementation;
using auth_service.Application.Usecase.Interface;
using auth_service.Application.Service;
using auth_service.Domain.Repository;
using auth_service.Infrastructure.Database;
using auth_service.Infrastructure.Repository;
using auth_service.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Npgsql;
using Microsoft.OpenApi.Models;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Load environment variables
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
var allowedOriginsEnv = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Auth Service API", 
        Version = "v1",
        Description = "Authentication and Authorization Service API"
    });

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
builder.Services.AddHealthChecks();

// Database Configuration
string ConvertDatabaseUrl(string url)
{
    if (string.IsNullOrEmpty(url))
    {
        throw new ArgumentException("Database URL cannot be null or empty");
    }

    if (url.StartsWith("postgresql://"))
    {
        url = url.Replace("postgresql://", "postgres://");
    }

    var uri = new Uri(url);
    var userInfo = uri.UserInfo.Split(':');

    var username = userInfo[0];
    var password = userInfo.Length > 1 ? userInfo[1] : "";

    var database = uri.LocalPath.TrimStart('/');
    if (string.IsNullOrEmpty(database))
    {
        database = "neondb";
    }

    var port = uri.Port > 0 ? uri.Port : 5432;

    return $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
}

string GetConnectionString()
{
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        return ConvertDatabaseUrl(databaseUrl);
    }

    var databaseUrlFromConfig = builder.Configuration["DATABASE_URL"];
    if (!string.IsNullOrEmpty(databaseUrlFromConfig))
    {
        return ConvertDatabaseUrl(databaseUrlFromConfig);
    }

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString))
    {
        return connectionString;
    }

    throw new InvalidOperationException("No database configuration found");
}

builder.Services.AddDbContext<UserDbContext>(options =>
{
    var connectionString = GetConnectionString();
    options.UseNpgsql(connectionString);
});

// Dependency Injection
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserUseCase, UserUseCase>();
builder.Services.AddScoped<IBcryptPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IJWTTokenProvidder, JWTTokenProvidder>();
builder.Services.AddScoped<IEmailService, EmailService>();

// JWT Configuration
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var secretKey = jwtSecret ?? builder.Configuration["JWT:SecretKey"];
        var issuer = jwtIssuer ?? builder.Configuration["JWT:Issuer"];
        var audience = jwtAudience ?? builder.Configuration["JWT:Audience"];

        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("JWT Secret is not configured");
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer ?? "auth-service",
            ValidAudience = audience ?? "auth-service-client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            // Note: role and name claim mapping can be configured here if needed
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization(options =>
    {
        // Policy chỉ dành cho Admin
        options.AddPolicy("AdminOnly", policy => 
            policy.RequireRole("Admin"));
        
        // Policy dành cho Admin và Instructor
        options.AddPolicy("AdminOrInstructor", policy => 
            policy.RequireRole("Admin", "Instructor"));
        
        // Policy dành cho Premium users trở lên
        options.AddPolicy("PremiumOrHigher", policy => 
            policy.RequireRole("Premium_Student", "Instructor", "Admin"));
    });

// CORS Configuration
builder.Services.AddCors(options =>
{
    string[] origins;

    if (!string.IsNullOrEmpty(allowedOriginsEnv))
    {
        origins = allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries)
                 .Select(origin => origin.Trim())
                 .ToArray();
    }
    else
    {
        var allowedOriginsConfig = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        
        if (allowedOriginsConfig != null && allowedOriginsConfig.Length > 0)
        {
            origins = allowedOriginsConfig;
        }
        else
        {
            origins = new[] {
                "https://coder-de-poet.vercel.app",
                "https://coder-de-poet-2.onrender.com",
                "https://coder-de-poet-4.onrender.com",
                "http://localhost:3001",
                "http://localhost:3000",
                "http://144.91.74.84"
            };
        }
    }

    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

    try
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();

    var maxRetries = 2; // Giảm retries
    for (int i = 1; i <= maxRetries; i++)
    {
        try
        {
            if (dbContext.Database.CanConnect())
            {
                // Kiểm tra xem có migration pending không
                var pendingMigrations = dbContext.Database.GetPendingMigrations().ToList();
                if (pendingMigrations.Any())
                {
                    dbContext.Database.EnsureCreated();
                }
                // Nếu không có migration pending, không làm gì cả
                break;
            }
        }
        catch (Exception) when (i < maxRetries)
        {
            // Bỏ qua lỗi "already exists" - table đã tồn tại là OK
            break;
        }
        catch (Exception) when (i < maxRetries)
        {
            await Task.Delay(3000);
        }
    }
}
    catch (Exception)
    {
        // Không throw - app vẫn chạy dù migration có lỗi
    }

// Configure the HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("../swagger/v1/swagger.json", "Auth Service API v1");
    c.RoutePrefix = "swagger";
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapHealthChecks("/health");
//app.UseHttpsRedirection();
app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();