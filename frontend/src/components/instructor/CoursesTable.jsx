import React from "react";
import {
  FiEdit2,
  FiBarChart2,
  FiTrash2,
} from "react-icons/fi";
import { getThumbnailUrl } from "../../utils/thumbnailHelper";

const CoursesTable = ({ courses, onView, onEdit, onAnalytics, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
          <th className="px-4 py-3 text-left">Course</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-center">Students</th>
          <th className="px-4 py-3 text-center">Rating</th>
          <th className="px-4 py-3 text-center">Created</th>
          <th className="px-4 py-3 text-center">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {courses.map((course) => (
          <tr
            key={course.id}
            className="hover:bg-blue-50 transition-all duration-150 cursor-pointer"
          >
            {/* Click vào phần này để xem chi tiết */}
            <td
              className="px-4 py-3 flex items-center gap-3"
              onClick={() => onView(course)}
            >
              <img
                src={getThumbnailUrl(course.thumbnail_url)}
                alt={course.title}
                className="w-16 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="truncate">
                <p className="font-medium text-gray-800 hover:text-blue-600 truncate">
                  {course.title}
                </p>
                <p className="text-xs text-gray-500">
                  {course.category_name || course.category || 'N/A'} • Updated{" "}
                  {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </td>

            {/* Status */}
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

            <td className="px-4 py-3 text-center">{course.student_count}</td>

            <td className="px-4 py-3 text-center">
              {course.rating ? `${course.rating.toFixed(1)} ⭐` : "-"}
            </td>

            <td className="px-4 py-3 text-center">
              {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : 'N/A'}
            </td>

            {/* Hành động (icon) */}
            <td className="px-4 py-3 text-center">
              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(course);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50"
                  title="Edit course"
                >
                  <FiEdit2 className="text-[17px]" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnalytics(course);
                  }}
                  className="text-teal-600 hover:text-teal-800 p-1 rounded-md hover:bg-teal-50"
                  title="View statistics"
                >
                  <FiBarChart2 className="text-[17px]" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(course);
                  }}
                  className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                  title="Delete course"
                >
                  <FiTrash2 className="text-[17px]" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CoursesTable;
