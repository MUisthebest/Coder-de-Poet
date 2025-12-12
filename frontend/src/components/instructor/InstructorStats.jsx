// src/components/instructor/InstructorStats.jsx
import React from "react";
import {
  BookOpen,
  Users,
  Star,
  DollarSign,
} from "lucide-react"; // ✅ Lucide React icons

const InstructorStats = ({ stats }) => {
  const cards = [
    {
      label: "Total Courses",
      value: stats.totalCourses ?? 0,
      sub: "Published, Draft, Pending",
      icon: BookOpen,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Active Students",
      value: stats.totalStudents ?? 0,
      sub: "Across all your courses",
      icon: Users,
      gradient: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="relative bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            {/* Icon background */}
            <div
              className={`absolute top-4 right-4 bg-gradient-to-br ${c.gradient} text-white rounded-lg w-10 h-10 flex items-center justify-center shadow-md`}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Text */}
            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <h3 className="text-2xl font-semibold text-gray-800">
              {c.value}
            </h3>
            <p className="text-xs text-gray-400">{c.sub}</p>

            {/* Hover animation border glow */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-100 transition-all"></div>
          </div>
        );
      })}
    </div>
  );
};

export default InstructorStats;
