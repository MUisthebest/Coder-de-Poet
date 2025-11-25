/*
    This file sets up the connection to the NeonDb database using connection string
*/

using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Text;

namespace auth_service.Infrastructure.Database
{
    public class DbConnection
    {
        private readonly string _connectionString;

        private readonly IConfiguration _configuration;

        public DbConnection(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration["DATABASE_URL"] ?? string.Empty;
        }


        public async Task<NpgsqlConnection> GetNpgsqlConnectionAsync()
        {
            try
            {
                var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();
                Console.WriteLine("Database connection established.");
                return connection;
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error connecting to the database: {ex.Message}");
                throw;
            }
        }

    }
}
