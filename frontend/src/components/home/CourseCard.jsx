import React from 'react';
import { NavLink } from 'react-router-dom';

const CourseCard = ({ course }) => {
  return (
    <NavLink
      to={`/courses/${course.id}`}
      className={`block bg-white rounded-xl shadow-sm p-6 relative hover:shadow-md transition ${
        course.featured ? 'border-2 border-blue-500' : 'border border-gray-200'
      }`}
    >
      {course.featured && (
        <div className="absolute -top-3 right-6 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Featured course
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0 flex-1 mr-4">
          {course.title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex text-amber-400">{'★'.repeat(5)}</div>
          <span className="text-gray-600 text-sm">{course.rating}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <span className="text-gray-500 text-sm">
          {course.students.toLocaleString()} students • {course.duration}
        </span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{course.instructor}</div>
            <div className="text-gray-500 text-xs">{course.friends} Friends</div>
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${course.progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Progress</span>
        <span>{course.progress}%</span>
      </div>
    </NavLink>
  );
};

export default CourseCard;
