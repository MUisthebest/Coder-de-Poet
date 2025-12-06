// EmptyCoursesState.jsx
import React from "react";

const EmptyCoursesState = ({ onCreateCourse }) => (
  <div className="text-center py-16">
    <div className="text-6xl mb-3">📘</div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      No courses found
    </h3>
    <p className="text-gray-500 mb-5">
      You haven’t created any courses yet. Let’s get started!
    </p>
    <button
      onClick={onCreateCourse}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
    >
      + Create Your First Course
    </button>
  </div>
);

export default EmptyCoursesState;
