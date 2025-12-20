import React, { useEffect, useMemo, useState } from "react";
import instructorService from "../../services/instructorService";
import InstructorStats from "../../components/instructor/InstructorStats";
import CoursesTable from "../../components/instructor/CoursesTable";
import EmptyCoursesState from "../../components/instructor/EmptyCoursesState";
import InstructorAddLesson from "./InstructorAddLesson";
import InstructorAddCourse from "./InstructorAddCourse";
import InstructorEditCourse from "./InstructorEditCourse";
import CourseDetailModal from "./CourseDetailModal";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import ProfileSidebar from '../../components/home/ProfileSideBar';
import axios from 'axios';

const InstructorDashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const { user: instructorId, isAuthenticated, user } = useAuth();
  
  // State lưu toàn bộ response data
  const [responseData, setResponseData] = useState(null);
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
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch courses
  useEffect(() => {
    console.log("Fetching courses for instructor:", instructorId?.id);
    if (!instructorId?.id) return;
    
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await instructorService.getCoursesByInstructor(instructorId.id);
        console.log("API Response:", data);
        setResponseData(data);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [instructorId]);

  // Lấy courses array từ response data
  const coursesArray = useMemo(() => {
    if (!responseData) return [];
    if (responseData.courses?.items && Array.isArray(responseData.courses.items)) {
      return responseData.courses.items;
    }
    return [];
  }, [responseData]);

  const handleViewCourse = (course) => {
    console.log("View course", course.id);
    setSelectedCourse(course);
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await instructorService.deleteCourse(course.id);
      
      // Cập nhật state
      setResponseData(prev => {
        if (!prev || !prev.courses?.items) return prev;
        
        const updatedItems = prev.courses.items.filter(c => c.id !== course.id);
        return {
          ...prev,
          courses: {
            ...prev.courses,
            items: updatedItems,
            total: updatedItems.length
          }
        };
      });
      
      alert("Course deleted successfully!");
    } catch {
      alert("Failed to delete course.");
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalCourses = coursesArray.length;
    
    const totalStudents = coursesArray.reduce(
      (sum, c) => sum + (c.student_count || 0),
      0
    );
    
    // Lọc courses có rating (nếu có field rating)
    const ratedCourses = coursesArray.filter((c) => c.rating != null);
    const avgRating =
      ratedCourses.length > 0
        ? (
            ratedCourses.reduce((sum, c) => sum + (c.rating || 0), 0) /
            ratedCourses.length
          ).toFixed(1)
        : "-";
    
    // Tính tổng reviews (nếu có field reviewsCount)
    const totalReviews = coursesArray.reduce(
      (sum, c) => sum + (c.reviewsCount || 0),
      0
    );

    return {
      totalCourses,
      totalStudents,
      avgRating,
      totalReviews,
      thisMonthRevenue: 24500000, // Tạm thời hardcode
    };
  }, [coursesArray]);

  // Filter và sort courses
  const filteredCourses = useMemo(() => {
    let result = [...coursesArray];
    
    // Filter by search
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter((c) => 
        c.title?.toLowerCase().includes(keyword)
      );
    }
    
    // Filter by status
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    
    // Filter by category
    if (categoryFilter) {
      result = result.filter((c) => c.category_id === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.updated_at || 0) - new Date(b.updated_at || 0);
      }
      if (sortBy === "students") {
        return (b.student_count || 0) - (a.student_count || 0);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });
    
    return result;
  }, [coursesArray, search, statusFilter, categoryFilter, sortBy]);

  // Fetch categories
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
  }, [API_URL]);

  // Sample data cho sidebar
  const weeklyActivities = [
    { day: 'Mon', hours: 2.5, type: 'learning' },
    { day: 'Tue', hours: 1.8, type: 'practice' },
    { day: 'Wed', hours: 3.2, type: 'learning' },
    { day: 'Thu', hours: 2.0, type: 'project' },
    { day: 'Fri', hours: 4.1, type: 'learning' },
    { day: 'Sat', hours: 1.5, type: 'review' },
    { day: 'Sun', hours: 2.8, type: 'practice' }
  ];

  const myCourses = [
    {
      id: 1,
      title: 'Crawler with Python for Beginners',
      category: 'Python Tutorials',
      progress: 85,
      students: 9530,
      nextLesson: 'State Management',
      timeLeft: '2h 15m'
    },
    // ... other courses
  ];

  const friends = [
    { id: 1, name: 'Alex Johnson', course: 'React Native' },
    // ... other friends
  ];

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
          <div className="flex flex-row gap-2 mt-4 sm:mt-0">
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

        {/* Modals */}
        {showAddLesson && (
          <InstructorAddLesson
            onClose={() => setShowAddLesson(false)} 
            MyCourse={filteredCourses}
          />
        )}

        {showAddCourse && (
          <InstructorAddCourse
            onClose={() => setShowAddCourse(false)} 
            categories={categories}
          />
        )}

        {/* STATS */}
        <InstructorStats stats={stats} />

        {/* Course Detail Modal */}
        {selectedCourse && (
          <CourseDetailModal
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
          />
        )}

        {/* MAIN CONTENT - Courses Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-1 flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              My Courses
            </h2>
            <span className="text-sm text-gray-500">
              {filteredCourses.length} / {coursesArray.length} courses
            </span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading courses...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : coursesArray.length === 0 ? (
            <EmptyCoursesState/>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No courses found for your filters.
            </div>
          ) : (
            <div className="flex-1 overflow-hidden"> {/* Thêm wrapper này */}
              <div className="h-full overflow-y-auto max-h-[45vh]"> {/* Thêm scroll container */}
                <CoursesTable
                  courses={filteredCourses}
                  onView={handleViewCourse}
                  onEdit={(c) => console.log("Edit", c.id)}
                  onAnalytics={(c) => console.log("Analytics", c.id)}
                  onDelete={handleDeleteCourse}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="flex h-screen justify-center items-center sticky top-0">
        <ProfileSidebar 
          weeklyActivities={weeklyActivities}
          myCourses={myCourses}
          friends={friends}
          user={user}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
};

export default InstructorDashboard;