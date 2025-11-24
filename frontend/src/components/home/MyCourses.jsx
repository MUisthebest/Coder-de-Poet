import React from 'react';

const MyCourses = ({ courses }) => {
  // Nhóm courses theo category
  const coursesByCategory = courses.reduce((acc, course) => {
    if (!acc[course.category]) {
      acc[course.category] = {
        courses: [],
        totalStudents: 0,
        averageRating: 0
      };
    }
    acc[course.category].courses.push(course);
    acc[course.category].totalStudents += course.students;
    return acc;
  }, {});

  // Tính rating trung bình cho mỗi category
  Object.keys(coursesByCategory).forEach(category => {
    const categoryCourses = coursesByCategory[category].courses;
    const avgRating = categoryCourses.reduce((sum, course) => sum + course.rating, 0) / categoryCourses.length;
    coursesByCategory[category].averageRating = avgRating.toFixed(1);
  });

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>
      
      <div className="space-y-6 max-h-70 overflow-y-auto custom-scrollbar mb-6 px-2 w-[100%]">
        {Object.entries(coursesByCategory).map(([category, data]) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">{category}</span>
              <div className="flex items-center gap-1">
                <span className="text-amber-400 text-sm">★</span>
                <span className="text-gray-600 text-sm font-medium">{data.averageRating}</span>
              </div>
            </div>

            {/* Courses List */}
            <div className="space-y-3">
              {data.courses.map((course) => (
                <div key={course.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 leading-tight">
                    {course.title}
                  </h4>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500 text-xs">
                      {course.students.toLocaleString()} students
                    </span>
                    <span className="text-gray-500 text-xs">{course.timeLeft}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>

                  {/* Next Lesson */}
                  {course.nextLesson && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        Next: <span className="font-medium">{course.nextLesson}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
        View All Courses
      </button>
    </div>
  );
};

export default MyCourses;