// CoursesTable.jsx
import React from "react";

const CoursesTable = ({ courses, onView, onEdit, onAnalytics, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
          <th className="px-4 py-3">Course</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Students</th>
          <th className="px-4 py-3">Rating</th>
          <th className="px-4 py-3">Created</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {courses.map((course) => (
          <tr
            key={course.id}
            className="hover:bg-gray-50 transition-colors duration-150"
          >
            <td className="px-4 py-3 flex items-center gap-3">
              <img
                src={course.thumbnailUrl || "https://via.placeholder.com/80"}
                alt=""
                className="w-16 h-10 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium text-gray-800">{course.title}</p>
                <p className="text-xs text-gray-500">
                  {course.category} • Updated{" "}
                  {new Date(course.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </td>
            <td className="px-4 py-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.status === "published"
                    ? "bg-green-100 text-green-700"
                    : course.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {course.status}
              </span>
            </td>
            <td className="px-4 py-3">{course.studentsCount}</td>
            <td className="px-4 py-3">
              {course.rating ? `${course.rating.toFixed(1)} ⭐` : "-"}
            </td>
            <td className="px-4 py-3">
              {new Date(course.createdAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 space-x-2">
              <button
                onClick={() => onView(course)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View
              </button>
              <button
                onClick={() => onEdit(course)}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => onAnalytics(course)}
                className="text-teal-600 hover:text-teal-800 font-medium"
              >
                Stats
              </button>
              <button
                onClick={() => onDelete(course)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CoursesTable;
