import React, { useState } from "react";
import { useParams } from "react-router-dom";

// MOCK LESSONS (dữ liệu bạn gửi)
const lessons = [
  { id: "1", course_id: "1", title: "OOP JS #1 - Introduction", url: "https://www.youtube.com/watch?v=4l3bTDlT6ZI", position: 1 },
  { id: "2", course_id: "1", title: "OOP JS #2 - Object Literals", url: "https://www.youtube.com/watch?v=7d9H34ZVRPg", position: 2 },
  { id: "3", course_id: "1", title: "OOP JS #3 - Updating Properties", url: "https://www.youtube.com/watch?v=ni9e-lOEw3Q", position: 3 },
  { id: "4", course_id: "1", title: "OOP JS #4 - Classes", url: "https://www.youtube.com/watch?v=Ug4ChzopcE4", position: 4 },
  { id: "5", course_id: "1", title: "OOP JS #5 - Class Constructors", url: "https://www.youtube.com/watch?v=HboT8g_QSGc", position: 5 },
  { id: "1d91...", course_id: "1", title: "OOP JS #6 - Class Methods", url: "https://www.youtube.com/watch?v=hy-C4NY7A_8", position: 6 },
  { id: "0237...", course_id: "1", title: "OOP JS #7 - Method Chaining", url: "https://www.youtube.com/watch?v=8x1fygdWabY", position: 7 },
  { id: "658f...", course_id: "1", title: "OOP JS #8 - Class Inheritance", url: "https://www.youtube.com/watch?v=_cgBvtYT3fQ", position: 8 },
  { id: "a1bd...", course_id: "1", title: "OOP JS #9 - Constructors (under the hood)", url: "https://www.youtube.com/watch?v=3HsLZ7WUUt4", position: 9 },
  { id: "f1fd...", course_id: "1", title: "OOP JS #10 - Prototype", url: "https://www.youtube.com/watch?v=4jb4AYEyhRc", position: 10 },
];

// Convert youtube watch link → embed
const getEmbedUrl = (url) => {
  const id = url.split("v=")[1].split("&")[0];
  return `https://www.youtube.com/embed/${id}`;
};

const getThumbnail = (url) => {
  const id = url.split("v=")[1].split("&")[0];
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};


const CourseDetail = () => {
  const { id } = useParams();

  // Filter lessons theo course_id
  const courseLessons = lessons
    .filter((l) => l.course_id === id)
    .sort((a, b) => a.position - b.position);

  // Lesson đầu tiên làm video mặc định
  const [currentLesson, setCurrentLesson] = useState(courseLessons[0]);

  return (
    <div className="flex max-w-7xl mx-auto mt-10 gap-6 sm:px-5">
      {/* LEFT: VIDEO + TITLE */}
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold">{currentLesson.title}</h1>

        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={getEmbedUrl(currentLesson.url)}
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </div>

      {/* RIGHT: LESSON LIST */}
      <div className="w-80 bg-white rounded-xl shadow p-4 h-fit">
        <h2 className="font-semibold mb-3 text-lg">Course Lessons</h2>
        <div className="space-y-2 p-1 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-button]:hidden">
            {courseLessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setCurrentLesson(lesson)}
                className={`flex items-center gap-3 w-full text-left p-2 rounded-lg border ${
                  currentLesson.id === lesson.id
                    ? "bg-[#666] text-white border-blue-600"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <img
                  src={getThumbnail(lesson.url)}
                  alt={lesson.title}
                  className="w-20 h-12 object-cover rounded"
                />
                <span className="text-sm">{lesson.position}. {lesson.title}</span>
              </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default CourseDetail;
