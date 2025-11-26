/*
    This file will define actions that can be performed by users in the authentication service.
*/

namespace auth_service.Domain.Entity
{
    public static class Action
    {
        public const string View_Course = "View_Course";
        public const string Enroll_Course = "Enroll_Course";
        public const string Create_Course = "Create_Course";
        public const string Delete_Course = "Delete_Course";
        public const string Manage_Users = "Manage_Users";
    }
}