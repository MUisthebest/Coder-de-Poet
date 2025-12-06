import React, { useEffect, useMemo, useState } from "react";
import instructorService from "../../services/instructorService";
import InstructorStats from "../../components/instructor/InstructorStats";
import CoursesFilterBar from "../../components/instructor/CoursesFilterBar";
import CoursesTable from "../../components/instructor/CoursesTable";
import EmptyCoursesState from "../../components/instructor/EmptyCoursesState";

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await instructorService.getCourses();
        const mapped = data.map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category?.name ?? c.category ?? "Other",
          thumbnailUrl: c.thumbnail_url || c.thumbnailUrl,
          status: c.status,
          studentsCount: c.students_count ?? 0,
          rating: c.rating ?? null,
          reviewsCount: c.reviews_count ?? 0,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        setCourses(mapped);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalStudents = courses.reduce(
      (sum, c) => sum + (c.studentsCount || 0),
      0
    );
    const ratedCourses = courses.filter((c) => c.rating);
    const avgRating =
      ratedCourses.length > 0
        ? (
            ratedCourses.reduce((sum, c) => sum + c.rating, 0) /
            ratedCourses.length
          ).toFixed(1)
        : "-";
    const totalReviews = ratedCourses.reduce(
      (sum, c) => sum + (c.reviewsCount || 0),
      0
    );

    return {
      totalCourses,
      totalStudents,
      avgRating,
      totalReviews,
      thisMonthRevenue: 24500000,
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(keyword));
    }
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (categoryFilter)
      result = result.filter((c) => c.category === categoryFilter);

    result.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "students")
        return (b.studentsCount || 0) - (a.studentsCount || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
    return result;
  }, [courses, search, statusFilter, categoryFilter, sortBy]);

  const handleCreateCourse = () => {
    console.log("Navigate to create course page");
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await instructorService.deleteCourse(course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch {
      alert("Failed to delete course.");
    }
  };

  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => c.category && set.add(c.category));
    return Array.from(set);
  }, [courses]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-5 sm:px-10">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Instructor Dashboard
          </h1>
          <p className="text-gray-500">
            Welcome back! Manage and track your courses.
          </p>
        </div>
        <button
          onClick={handleCreateCourse}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
        >
          + Create New Course
        </button>
      </header>

      {/* STATS */}
      <InstructorStats stats={stats} />

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 mb-6">
        <CoursesFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          categories={categories}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            My Courses
          </h2>
          <span className="text-sm text-gray-500">
            {filteredCourses.length} / {courses.length} courses
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : courses.length === 0 ? (
          <EmptyCoursesState onCreateCourse={handleCreateCourse} />
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No courses found for your filters.
          </div>
        ) : (
          <CoursesTable
            courses={filteredCourses}
            onView={(c) => console.log("View", c.id)}
            onEdit={(c) => console.log("Edit", c.id)}
            onAnalytics={(c) => console.log("Analytics", c.id)}
            onDelete={handleDeleteCourse}
          />
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
