import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import instructorService from "../../services/instructorService";
import InstructorStats from "../../components/instructor/InstructorStats";
import CoursesFilterBar from "../../components/instructor/CoursesFilterBar";
import CoursesTable from "../../components/instructor/CoursesTable";
import EmptyCoursesState from "../../components/instructor/EmptyCoursesState";
import InstructorAddLesson from "./InstructorAddLesson";
import InstructorAddCourse from "./InstructorAddCourse";
import InstructorEditCourse from "./InstructorEditCourse";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import ProfileSidebar from '../../components/home/ProfileSideBar';
import MyCourses from "../../components/home/MyCourses";
import axios from 'axios';

const InstructorDashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const navigate = useNavigate();
  const { user: instructorId, isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categories, setCategories] = useState([]);

  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [preSelectedCourse, setPreSelectedCourse] = useState(null);

  const [completionStats, setCompletionStats] = useState([]);

  useEffect(() => {
    console.log("Fetching courses for instructor:", instructorId.id);
    if (!instructorId.id) return;
    
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await instructorService.getCoursesByInstructor(instructorId.id);
        console.log("Fetched courses:", data);
        const courseList = data?.courses?.items || []; 
        
        // Fetch completion stats
        const completionData = await instructorService.getCourseCompletionStats(instructorId.id);
        console.log("Fetched completion stats:", completionData);
        setCompletionStats(completionData);
        
        // Merge completion stats with courses
        const coursesWithStats = courseList.map(course => {
          const stat = completionData.find(s => s.course_id === course.id);
          return {
            ...course,
            avgCompletionPercent: Number(stat?.avg_completion_percent) || 0,
            totalStudents: Number(stat?.total_students) || 0,
            activeStudents: Number(stat?.active_students) || 0
          };
        });
        
        setCourses(coursesWithStats);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [instructorId.id]);


  const handleViewCourse = (course) => {
    console.log("View course", course.id);
    sessionStorage.setItem("currentCourse", JSON.stringify(course));
    navigate(`/instructor/courses/${course.id}`);
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
  const weeklyActivities = [
    { day: 'Mon', hours: 2.5, type: 'learning' },
    { day: 'Tue', hours: 1.8, type: 'practice' },
    { day: 'Wed', hours: 3.2, type: 'learning' },
    { day: 'Thu', hours: 2.0, type: 'project' },
    { day: 'Fri', hours: 4.1, type: 'learning' },
    { day: 'Sat', hours: 1.5, type: 'review' },
    { day: 'Sun', hours: 2.8, type: 'practice' }
  ];

  const friends = [
    { id: 1, name: 'Alex Johnson', course: 'React Native' },
    { id: 2, name: 'Maria Garcia', course: 'UI/UX Design' },
    { id: 3, name: 'Tom Wilson', course: 'Data Science' },
    { id: 4, name: 'Sarah Chen', course: 'Web Development' },
    { id: 5, name: 'Mike Brown', course: 'Cloud Computing' }
  ];

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    
    // Calculate total students from completion stats (total_students from enrollments)
    const totalStudents = courses.reduce(
      (sum, c) => sum + (Number(c.totalStudents) || Number(c.studentsCount) || 0),
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

    // Calculate average quiz completion percentage across all courses
    const avgQuizCompletion = courses.length > 0
      ? (courses.reduce((sum, c) => sum + (c.avgCompletionPercent || 0), 0) / courses.length).toFixed(1)
      : "0.0";

    return {
      totalCourses,
      totalStudents,
      avgRating,
      totalReviews,
      thisMonthRevenue: 24500000,
      avgQuizCompletion,
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

  // const handleCreateCourse = () => {
  //   console.log("Navigate to create course page");
  // };


    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await axios.get(`${API_URL}/categories`);
          if (response.data && response.data.categories) {
            setCategories(response.data.categories);
          }
        } catch (error) {
          console.error(error);
        }
      };

      fetchCategories();
    }, []);

  return (
    <div className="flex flex-row min-h-screen w-full">
      <div className="min-h-screen mx-auto bg-gray-50 py-10 px-5 sm:px-10 max-w-8xl md:flex flex-col w-full">
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
            {/* <button
              onClick={handleCreateCourse}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
            >
              + Create New Course
            </button> */}
            <div className="flex flex-row gap-2">
              <button
                onClick={() => setShowAddCourse(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus className="text-lg" />
                Add Course
              </button>

              <button
                onClick={() => setShowAddLesson(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus className="text-lg" />
                Add Lesson
              </button>
            </div>


          </header>
          {showAddLesson && (
            <InstructorAddLesson
              onClose={() => setShowAddLesson(false)} MyCourse = {filteredCourses}
            />
          )}

          {showAddCourse && (
            <InstructorAddCourse
              onClose={() => setShowAddCourse(false)} categories={categories}
            />
          )}
          {/* STATS */}
          <InstructorStats stats={stats} />

          {/* FILTERS */}
          {/* <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 mb-6">
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
          </div> */}

          {/* MAIN CONTENT */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-1 flex-col md:max-h-[60vh]">
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
              <EmptyCoursesState/>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No courses found for your filters.
              </div>
            ) : (
              <CoursesTable
                courses={filteredCourses}
                onView={handleViewCourse}
                 onEdit={(course) => {
                  setEditingCourse(course);
                  setShowEditCourse(true);
                }}
                onAnalytics={(c) => console.log("Analytics", c.id)}
                onDelete={handleDeleteCourse}
              />
              
            )}
            {showEditCourse && (
              <InstructorEditCourse
                onClose={() => setShowEditCourse(false)}
                course={editingCourse}
                categories={categories}
            />
            )}
          </div>
        </div>
        <div className="flex h-screen justify-center items-center sticky top-0">
          <ProfileSidebar 
            weeklyActivities={weeklyActivities}
            myCourses={courses}
            friends={friends}
            user={user}
            isAuthenticated={isAuthenticated}
          />
        </div>
    </div>
  );
};

export default InstructorDashboard;
