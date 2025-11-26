/*
    This file using Entity Framework Core as ORM to interact with the NeonDb database.
    Mapping domain entities to database tables and configuring the DbContext.
*/

using auth_service.Domain.Entity;
using Microsoft.EntityFrameworkCore;


namespace auth_service.Infrastructure.Database
{
    public class UserDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public UserDbContext(DbContextOptions<UserDbContext> options) : base(options) { }
        public UserDbContext() { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                //Check constraints for User role in db has only 4 possible values: Normal student, premium student, instructor and Admin

                
                entity.ToTable("Users", table =>
                {
                    table.HasCheckConstraint("CK_User_UserRole_Enum", 
                    "\"UserRole\" IN ('Normal_Student', 'Premium_Student', 'Instructor', 'Admin')");
                });

                entity.HasKey(e => e.Id);

                entity.HasIndex(e => e.Email).IsUnique();

                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);

                entity.Property(e => e.HashedPassword).IsRequired().HasMaxLength(255);

                entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);

                
                entity.Property(e => e.UserRole).IsRequired().HasMaxLength(50).HasDefaultValue(User_Role.Normal_Student);

                entity.Property(e => e.RefreshToken).HasMaxLength(500);


            });
        }
    }

}


