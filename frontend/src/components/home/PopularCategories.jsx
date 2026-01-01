import React, { useMemo } from 'react';
import CourseCard from './CourseCard';

const PopularCategories = ({ courses }) => {
  const topCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => b.students - a.students)
      .slice(0, 4);
  }, [courses]);

  const formatStudents = (students) => {
    if (students >= 1000) return `${(students / 1000).toFixed(1)}k`;
    return students.toString();
  };

  const rows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < topCourses.length; i += 2) {
      rows.push(topCourses.slice(i, i + 2));
    }
    return rows;
  }, [topCourses]);

  const formatTag = (tag) => {
    if (!tag) return '';
    const formatted = tag.replace(/-/g, ' ');
    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (topCourses.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm md:p-6 p-1">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Popular Courses</h3>
        <span className="text-black text-sm font-medium">
          {topCourses.length} courses • Highest enrollment
        </span>
      </div>

      {/* GRID với CourseCard */}
      <div className="space-y-6">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {row.map((course, courseIndex) => (
              <CourseCard 
                key={course.id} 
                course={course} 
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">Total students:</span>
              <span className="font-semibold text-gray-900 ml-1">
                {formatStudents(topCourses.reduce((sum, c) => sum + c.students, 0))}
              </span>
            </div>
            
            <div className="text-sm">
              <span className="text-gray-600">Top category:</span>
              <span className="font-semibold text-gray-900 ml-1">
                {topCourses[0]?.category || 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">Popular tags:</span>
              <span className="font-semibold text-gray-900 ml-1">
                {(() => {
                  // Xử lý tags có thể là object, array hoặc string
                  const allTags = topCourses.flatMap(c => {
                    if (!c.tags) return [];
                    if (Array.isArray(c.tags)) return c.tags;
                    if (typeof c.tags === 'string') return [c.tags];
                    if (typeof c.tags === 'object') return Object.values(c.tags).filter(Boolean);
                    return [];
                  });
                  
                  const tagCounts = {};
                  
                  allTags.forEach(tag => {
                    if (tag) {
                      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                  });
                  
                  const popularTags = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([tag]) => formatTag(tag))
                    .join(', ');
                  
                  return popularTags || 'No tags';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularCategories;