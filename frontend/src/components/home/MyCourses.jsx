import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import { getThumbnailUrl } from '../../utils/thumbnailHelper';

const MyCourses = ({ courses: coursesProp = [], user }) => {
  const [courses, setCourses] = useState([]);
  const [unenrollingCourseId, setUnenrollingCourseId] = useState(null);
  const [courseThumbnails, setCourseThumbnails] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const carouselRef = useRef(null);
  const thumbnailCacheRef = useRef({});

  /* =======================
      Helpers
  ======================= */

  const getPopularTags = (tags, limit = 2) => {
    if (!Array.isArray(tags)) return [];
    return [...new Set(tags)].slice(0, limit);
  };

  const formatTag = (tag) =>
    tag
      ?.replace(/-/g, ' ')
      .split(' ')
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');

  /* =======================
      Sync props → state
  ======================= */

  useEffect(() => {
    if (!coursesProp || coursesProp.length === 0) {
      setCourses([]);
      return;
    }

    setCourses(coursesProp);
    fetchCourseThumbnails(coursesProp);
  }, [coursesProp]);

  /* =======================
      Thumbnail handling
  ======================= */

  const fetchCourseThumbnails = async (courseList) => {
    const token = authService.getStoredToken();

    const tasks = courseList.map(async (course) => {
      const id = course.id;

      const cached = thumbnailCacheRef.current[id];
      if (cached && Date.now() - cached.timestamp < 30000) {
        return { id, url: cached.url };
      }

      try {
        const res = await axios.get(
          `${API_URL}/courses/${id}/thumbnail`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );

        const url = res.data?.thumbnail_url || course.thumbnail || '';

        thumbnailCacheRef.current[id] = {
          url,
          timestamp: Date.now(),
        };

        return { id, url };
      } catch {
        return { id, url: course.thumbnail || '' };
      }
    });

    const results = await Promise.allSettled(tasks);
    const next = {};

    results.forEach(r => {
      if (r.status === 'fulfilled') {
        next[r.value.id] = r.value.url;
      }
    });

    setCourseThumbnails(prev => ({ ...prev, ...next }));
  };

  const refreshCourseThumbnail = async (courseId) => {
    try {
      const token = authService.getStoredToken();
      const res = await axios.get(
        `${API_URL}/courses/${courseId}/thumbnail`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { t: Date.now() },
        }
      );

      const url = res.data.thumbnail_url;

      thumbnailCacheRef.current[courseId] = {
        url,
        timestamp: Date.now(),
      };

      setCourseThumbnails(prev => ({ ...prev, [courseId]: url }));
      return url;
    } catch {
      return null;
    }
  };

  const getCourseThumbnail = (course) => {
    return getThumbnailUrl(
      courseThumbnails[course.id] || course.thumbnail
    );
  };

  /* =======================
      Unenroll
  ======================= */

  const handleUnenroll = async (courseId) => {
    if (!user || user.role !== 'Student') return;
    if (!window.confirm('Bạn có chắc muốn hủy đăng ký khóa học này?')) return;

    setUnenrollingCourseId(courseId);

    try {
      const token = authService.getStoredToken();
      await axios.delete(`${API_URL}/enrollments/unenroll`, {
        data: { userId: user.id, courseId },
        headers: { Authorization: `Bearer ${token}` },
      });

      setCourses(prev => prev.filter(c => c.id !== courseId));
      alert('Hủy đăng ký thành công');
    } catch {
      alert('Hủy đăng ký thất bại');
    } finally {
      setUnenrollingCourseId(null);
    }
  };

  /* =======================
      Carousel
  ======================= */

  const displayedCourses = courses.slice(startIndex, startIndex + 4);

  const goToSlide = (index) => {
    setCurrentIndex(index);

    if (index === 3) {
      setStartIndex(
        startIndex + 4 < courses.length ? startIndex + 4 : 0
      );
      setCurrentIndex(0);
    }

    carouselRef.current?.scrollTo({
      left: index * carouselRef.current.offsetWidth,
      behavior: 'smooth',
    });
  };

  /* =======================
      Render
  ======================= */

  if (!coursesProp) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Bạn chưa đăng ký khóa học nào</p>
        <button
          onClick={() => (window.location.href = '/courses')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Khám phá khóa học
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">My Courses</h3>

      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto pb-4 snap-x"
      >
        {displayedCourses.map(course => (
          <NavLink
            to={`/courses/${course.id}`}
            key={course.id}
            className="w-full bg-white rounded-lg border hover:shadow-lg snap-center"
          >
            <div className="h-40 bg-gray-200 relative">
              <img
                src={getCourseThumbnail(course)}
                alt={course.title}
                className="w-full h-full object-cover"
                onError={async (e) => {
                  const url = await refreshCourseThumbnail(course.id);
                  e.target.src =
                    url
                      ? getThumbnailUrl(url)
                      : 'https://via.placeholder.com/300x160';
                }}
              />

              {course.progress > 0 && (
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {course.progress}%
                </span>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between">
                <h4 className="font-semibold text-sm line-clamp-2">
                  {course.title}
                </h4>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnenroll(course.id);
                  }}
                  disabled={unenrollingCourseId === course.id}
                  className="text-red-500"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 flex gap-1 flex-wrap">
                {getPopularTags(course.tags).map((t, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    #{formatTag(t)}
                  </span>
                ))}
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {displayedCourses.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-black w-6' : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(MyCourses);
