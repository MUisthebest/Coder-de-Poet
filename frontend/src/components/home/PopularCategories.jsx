import React, { useMemo } from 'react';

const PopularCategories = ({ courses }) => {
  // Lấy 4 courses có số students cao nhất
  const topCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => b.students - a.students)
      .slice(0, 4);
  }, [courses]);

  // Format số students
  const formatStudents = (students) => {
    if (students >= 1000) {
      return `${(students / 1000).toFixed(1)}k`;
    }
    return students.toString();
  };

  // Chia thành 2 rows, mỗi row 2 courses
  const rows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < topCourses.length; i += 2) {
      rows.push(topCourses.slice(i, i + 2));
    }
    return rows;
  }, [topCourses]);

  // Hàm tạo màu gradient ngẫu nhiên cho image placeholder
  const getGradient = (index) => {
    const gradients = [
      'bg-[#FFDDAE]',   
      'bg-[#C6E7FF]',
      'bg-[#D4F6FF]',
      'bg-[#F6FCDF]',   
    ];
    return gradients[index % gradients.length];
  };

  if (topCourses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Top Popular Courses
        </h3>
        <span className="text-black text-sm font-medium">
          {topCourses.length} courses • Highest enrollment
        </span>
      </div>

      {/* Grid 2 columns */}
      <div className="space-y-6">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
            {row.map((course, courseIndex) => (
              <div
                key={course.id}
                className={`border border-gray-200 rounded-xl p-4 ${getGradient(rowIndex*2+courseIndex)}  hover:border-blue-300 transition-all duration-300 hover:shadow-md`}
              >
                <div className="flex gap-4">
                  {/* Course Image */}
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 bg-gradient-to-r bg-white rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">
                        <img src={course.image} />
                      </span>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="flex-1 min-w-0">
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                          {course.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-white text-black text-xs font-medium">
                            {course.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rating and Students */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          <div className="flex text-amber-400 text-sm">
                            <span className="text-amber-400">★</span>
                            <span className="text-amber-400">★</span>
                            <span className="text-amber-400">★</span>
                            <span className="text-amber-400">★</span>
                            <span className="text-amber-400">★</span>
                          </div>
                          <span className="text-gray-700 text-sm font-medium">
                            {course.rating}
                          </span>
                        </div>
                      </div>
                      
                      {/* Students Count */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatStudents(course.students)}
                        </div>
                        <div className="text-xs text-gray-500">students</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>

                    {/* Instructor and Duration */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                        <div className="text-xs text-gray-600">
                          by <span className="font-medium">{course.instructor}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {course.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Total students in top courses: 
            <span className="font-semibold text-gray-900 ml-1">
              {formatStudents(topCourses.reduce((sum, course) => sum + course.students, 0))}
            </span>
          </span>
          <span className="text-gray-600">
            Highest rated: 
            <span className="font-semibold text-gray-900 ml-1">
              {topCourses.sort((a, b) => b.rating - a.rating)[0]?.rating} stars
            </span>
          </span>
        </div>
      </div>

      {/* CSS cho line clamp */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PopularCategories;