import React from 'react';
import { NavLink } from 'react-router-dom';
import { getThumbnailUrl } from '../../utils/thumbnailHelper';

const CourseCard = ({ course }) => {
  const formatStudents = (students) => {
    if (students >= 1000) return `${(students / 1000).toFixed(1)}k`;
    return students.toString();
  };

  const getPopularTags = (courseTags, limit = 3) => {
    if (!courseTags || !Array.isArray(courseTags)) return [];
    const uniqueTags = [...new Set(courseTags)]; 
    return uniqueTags.slice(0, limit);
  };

  const formatTag = (tag) => {
    if (!tag) return '';
    const formatted = tag.replace(/-/g, ' ');
    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <NavLink
      to={`/courses/${course.id}`}
      className={`border border-gray-200 rounded-xl p-4 block bg-gradient-to-br from-[#E3E3E3] to-[#fff] hover:border-blue-400 hover:shadow-md transition-all duration-300`}
    >
      <div className="flex flex-row gap-4">
        
        {/* IMAGE */}
        <div className="flex-shrink-0 w-[50%]">
          <div className="relative w-full pt-[56.25%] bg-white rounded-lg overflow-hidden">
            <img
              src={getThumbnailUrl(course.image)}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x225?text=No+Image';
                e.target.className =
                  'absolute inset-0 w-full h-full object-contain bg-gray-100';
              }}
            />
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs">
              {course.instructor?.charAt(0) || 'I'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 truncate">
                by{' '}
                <span className="font-medium text-gray-800">
                  {course.instructor || 'Instructor'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
            {course.title}
          </h4>

          <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/80 text-black text-xs font-medium mb-3 border border-gray-200">
            {course.category}
          </span>

          {/* TAGS */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {getPopularTags(course.tags, 2).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-2 py-1 bg-white/70 rounded-md text-xs text-gray-700 font-medium border border-gray-200/50"
                >
                  #{formatTag(tag)}
                </span>
              ))}

              {course.tags && course.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium">
                  +{course.tags.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* PRICE + STUDENTS */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 text-sm">
              {course.price === 'Premium' ? (
                <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-medium rounded-full">
                  💎 {course.price}
                </span>
              ) : (
                <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                  🎓 {course.price}
                </span>
              )}
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 flex items-center gap-1">
                👥 {formatStudents(course.students)}
              </div>
              <div className="text-xs text-gray-500">enrolled</div>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR (if needed) */}
      {course.progress !== undefined && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Progress</span>
            <span>{course.progress}%</span>
          </div>
        </>
      )}
    </NavLink>
  );
};

export default CourseCard;
