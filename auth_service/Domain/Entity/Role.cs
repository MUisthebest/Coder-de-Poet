/*

    This file declares role types for users in the authentication service.
    which applies to Role-Based Access Control (RBAC) systems. 
*/

namespace auth_service.Domain.Entity
{
    public static class User_Role 
    {
        public const string Normal_Student = "Normal_Student";
        public const string Premium_Student = "Premium_Student";
        public const string Instructor = "Instructor";
        public const string Admin = "Admin";
    }
}