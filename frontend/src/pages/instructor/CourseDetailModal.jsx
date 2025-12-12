import React, { useEffect, useState } from "react";
import {
  FiX,
  FiBookOpen,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiVideo,
  FiPlus,
} from "react-icons/fi";
import instructorService from "../../services/instructorService";

const CourseDetailModal = ({ course, onClose, onAddLesson }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho modal Add Quiz
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([
    { 
      text: "", 
      type: "multiple-choice", 
      options: [{ text: "", isCorrect: false }],
      points: 1 
    },
  ]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!course?.id) return;
      try {
        setLoading(true);
        const data = await instructorService.getLessonsByCourse(course.id);
        setLessons(data);
      } catch (err) {
        console.error("Error fetching lessons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [course]);

  // Hàm mở modal thêm quiz cho lesson cụ thể
  const openAddQuizModal = (lesson) => {
    setSelectedLesson(lesson);
    setQuizTitle("");
    setQuestions([{ 
      text: "", 
      type: "multiple-choice", // Thêm type
      options: [{ text: "", isCorrect: false }],
      points: 1 // Thêm points
    }]);
    setShowQuizModal(true);
  };

  const addQuestion = () => {
    setQuestions([...questions, { 
      text: "", 
      type: "multiple-choice", // Thêm type
      options: [{ text: "", isCorrect: false }],
      points: 1 // Thêm points
    }]);
  };

  // Thêm option cho câu hỏi
  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  // Cập nhật text câu hỏi/option/isCorrect
  const updateQuestionText = (qIndex, text) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].text = text;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    const newQuestions = [...questions];
    if (field === "text") {
      newQuestions[qIndex].options[oIndex].text = value;
    } else if (field === "isCorrect") {
      newQuestions[qIndex].options[oIndex].isCorrect = value;
    }
    setQuestions(newQuestions);
  };

  // Xóa option hoặc question
  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    if (newQuestions[qIndex].options.length === 0) {
      newQuestions[qIndex].options.push({ text: "", isCorrect: false });
    }
    setQuestions(newQuestions);
  };

  const removeQuestion = (qIndex) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== qIndex));
    }
  };

  // Lưu quiz
  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      alert("Vui lòng nhập tiêu đề quiz");
      return;
    }
    if (questions.some(q => !q.text.trim() || q.options.some(o => !o.text.trim()))) {
      alert("Vui lòng điền đầy đủ câu hỏi và đáp án");
      return;
    }
    if (questions.some(q => !q.options.some(o => o.isCorrect))) {
      alert("Mỗi câu hỏi phải có ít nhất 1 đáp án đúng");
      return;
    }

    const quizData = {
      title: quizTitle,
      description: "",
      duration: 15,
      lessonId: selectedLesson.id,
      questions: questions.map((q, index) => {
          // Tìm đáp án đúng
          const correctOptions = q.options.filter(opt => opt.isCorrect);
          let correctAnswer = "";
          
          if (q.type === "multiple-choice") {
            correctAnswer = correctOptions[0]?.text || "";
          } else if (q.type === "true-false") {
            correctAnswer = q.options[0]?.isCorrect ? "true" : "false";
          } else if (q.type === "short-answer") {
            correctAnswer = q.options[0]?.text || "";
          }
          
          // Chuẩn bị options cho multiple-choice
          const options = q.type === "multiple-choice" 
            ? q.options.filter(opt => opt.text.trim() !== "").map(opt => opt.text)
            : undefined;

          return {
            content: q.text, // Đổi từ "text" thành "content"
            type: q.type,
            options: options,
            correctAnswer: correctAnswer,
            points: parseInt(q.points) || 1 // Đảm bảo là number
          };
        })
    };

    try {
      setSavingQuiz(true);
      // Giả sử API: POST /lessons/:id/add-quiz hoặc /quizzes với lessonId
      await instructorService.addQuizToLesson(selectedLesson.id, quizData);

      // Cập nhật lesson để hiển thị có quiz (tùy backend trả về gì)
      setLessons(lessons.map(l =>
        l.id === selectedLesson.id ? { ...l, hasQuiz: true } : l
      ));

      alert("Quiz đã được thêm thành công!");
      setShowQuizModal(false);
    } catch (err) {
      console.error("Error adding quiz:", err);
      alert("Có lỗi khi thêm quiz");
    } finally {
      setSavingQuiz(false);
    }
  };

  if (!course) return null;

  return (
    <>
      {/* Modal chính */}
      <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/40">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative border border-gray-100">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <FiX className="text-2xl" />
          </button>

          {/* Header, stats, description... (giữ nguyên như cũ) */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={course.thumbnail_url || "https://via.placeholder.com/100"}
              alt="Course"
              className="w-28 h-20 rounded-lg object-cover"
            />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <FiBookOpen className="text-blue-500" />
                {course.title}
              </h2>
              <p className="text-sm text-gray-500">{course.category} • {course.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-5">
            <div className="flex items-center gap-2 text-gray-700">
              <FiUsers /> {course.student_count || 0} students
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FiCalendar /> Updated: {new Date(course.updated_at).toLocaleDateString()}
            </div>
          </div>

          <div className="border-t pt-4 mb-6 text-gray-700 text-sm leading-relaxed">
            <p>{course.description || "This course currently has no description."}</p>
          </div>

          {/* Lessons List */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Lessons</h3>
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading lessons...</div>
          ) : lessons.length === 0 ? (
            <div className="text-center text-gray-400 py-4 text-sm">No lessons found.</div>
          ) : (
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
              {lessons.map((lesson, i) => (
                <div
                  key={lesson.id || i}
                  className="flex justify-between items-center p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {lesson.content_type === "video" ? (
                      <FiVideo className="text-blue-500 text-lg" />
                    ) : (
                      <FiFileText className="text-gray-500 text-lg" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{lesson.title}</p>
                      <p className="text-xs text-gray-500">
                        {lesson.content_type} • {new Date(lesson.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {lesson.content_url && (
                      <a
                        href={lesson.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Content
                      </a>
                    )}
                    <button
                      onClick={() => openAddQuizModal(lesson)}
                      className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition flex items-center gap-1"
                    >
                      <FiPlus /> Add Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">
              Close
            </button>
            <button onClick={() => onAddLesson && onAddLesson(course)} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg">
              Add Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add Quiz (modal con) */}
      {showQuizModal && (
        <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowQuizModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-2xl" />
            </button>

            <h3 className="text-xl font-semibold mb-4">
              Thêm Quiz vào: <span className="text-blue-600">{selectedLesson?.title}</span>
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề Quiz</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ví dụ: Kiểm tra kiến thức cuối bài"
              />
            </div>

            <div className="space-y-6">
              <h4 className="font-medium text-gray-800">Câu hỏi</h4>
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    placeholder={`Câu hỏi ${qIndex + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Loại câu hỏi</label>
                      <select
                        value={q.type || "multiple-choice"}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[qIndex].type = e.target.value;
                          setQuestions(newQuestions);
                        }}
                        className="ml-2 px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="multiple-choice">Trắc nghiệm</option>
                        <option value="true-false">Đúng/Sai</option>
                        <option value="short-answer">Tự luận ngắn</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Điểm</label>
                      <input
                        type="number"
                        min="1"
                        value={q.points || 1}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[qIndex].points = parseInt(e.target.value) || 1;
                          setQuestions(newQuestions);
                        }}
                        className="ml-2 px-2 py-1 border border-gray-300 rounded w-16"
                      />
                    </div>
                  </div>
                </div>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                {/* Render options dựa trên type */}
                {q.type === "multiple-choice" && (
                  <div className="space-y-2 ml-4">
                    <p className="text-sm text-gray-600 mb-2">Đáp án (chọn 1 đáp án đúng):</p>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={opt.isCorrect}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            // Với multiple-choice, chỉ cho phép 1 đáp án đúng
                            newQuestions[qIndex].options.forEach((option, idx) => {
                              newQuestions[qIndex].options[idx].isCorrect = idx === oIndex;
                            });
                            setQuestions(newQuestions);
                          }}
                        />
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(qIndex, oIndex, "text", e.target.value)}
                          placeholder={`Đáp án ${oIndex + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        {q.options.length > 1 && (
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(qIndex)}
                      className="text-sm text-blue-600 hover:underline mt-2"
                    >
                      + Thêm đáp án
                    </button>
                  </div>
                )}

                {q.type === "true-false" && (
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 mb-2">Chọn đáp án đúng:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`tf-${qIndex}`}
                          checked={q.options[0]?.text === "Đúng" && q.options[0]?.isCorrect}
                          onChange={() => {
                            const newQuestions = [...questions];
                            newQuestions[qIndex].options = [
                              { text: "Đúng", isCorrect: true },
                              { text: "Sai", isCorrect: false }
                            ];
                            setQuestions(newQuestions);
                          }}
                        />
                        <span>Đúng</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`tf-${qIndex}`}
                          checked={q.options[1]?.text === "Sai" && q.options[1]?.isCorrect}
                          onChange={() => {
                            const newQuestions = [...questions];
                            newQuestions[qIndex].options = [
                              { text: "Đúng", isCorrect: false },
                              { text: "Sai", isCorrect: true }
                            ];
                            setQuestions(newQuestions);
                          }}
                        />
                        <span>Sai</span>
                      </div>
                    </div>
                  </div>
                )}

                {q.type === "short-answer" && (
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 mb-2">Đáp án đúng:</p>
                    <input
                      type="text"
                      value={q.options[0]?.text || ""}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].options = [
                          { text: e.target.value, isCorrect: true }
                        ];
                        setQuestions(newQuestions);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Nhập đáp án đúng..."
                    />
                  </div>
                )}
              </div>
            ))}
              <button
                onClick={addQuestion}
                className="text-sm text-green-600 hover:underline"
              >
                + Thêm câu hỏi mới
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                disabled={savingQuiz}
              >
                Hủy
              </button>
              <button
                onClick={saveQuiz}
                disabled={savingQuiz}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
              >
                {savingQuiz ? "Đang lưu..." : "Lưu Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseDetailModal;