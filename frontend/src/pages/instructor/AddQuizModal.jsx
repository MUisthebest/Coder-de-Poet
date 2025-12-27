import React, { useState } from "react";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";
import instructorService from "../../services/instructorService";

const AddQuizModal = ({
  isOpen,
  onClose,
  selectedLesson,
  course,
  onQuizAdded,
}) => {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([
    {
      text: "",
      type: "multiple-choice",
      options: [{ text: "", isCorrect: false }],
      points: 1,
    },
  ]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [generatingAIQuiz, setGeneratingAIQuiz] = useState(false);

  if (!isOpen) return null;

  const resetModal = () => {
    setQuizTitle("");
    setQuestions([
      {
        text: "",
        type: "multiple-choice",
        options: [{ text: "", isCorrect: false }],
        points: 1,
      },
    ]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "multiple-choice",
        options: [{ text: "", isCorrect: false }],
        points: 1,
      },
    ]);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

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

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      alert("Vui lòng nhập tiêu đề quiz");
      return;
    }
    if (
      questions.some(
        (q) =>
          !q.text.trim() || q.options.some((o) => !o.text.trim())
      )
    ) {
      alert("Vui lòng điền đầy đủ câu hỏi và đáp án");
      return;
    }
    if (questions.some((q) => !q.options.some((o) => o.isCorrect))) {
      alert("Mỗi câu hỏi phải có ít nhất 1 đáp án đúng");
      return;
    }

    const quizData = {
      title: quizTitle,
      description: "",
      duration: 15,
      lessonId: selectedLesson.id,
      questions: questions.map((q) => {
        const correctOptions = q.options.filter((opt) => opt.isCorrect);
        let correctAnswer = "";

        if (q.type === "multiple-choice") {
          correctAnswer = correctOptions[0]?.text || "";
        } else if (q.type === "true-false") {
          correctAnswer = q.options[0]?.isCorrect ? "true" : "false";
        } else if (q.type === "short-answer") {
          correctAnswer = q.options[0]?.text || "";
        }

        const options =
          q.type === "multiple-choice"
            ? q.options
                .filter((opt) => opt.text.trim() !== "")
                .map((opt) => opt.text)
            : undefined;

        return {
          content: q.text,
          type: q.type,
          options: options,
          correctAnswer: correctAnswer,
          points: parseInt(q.points) || 1,
        };
      }),
    };

    try {
      setSavingQuiz(true);
      await instructorService.addQuizToLesson(selectedLesson.id, quizData);
      alert("Quiz đã được thêm thành công!");
      onQuizAdded();
      handleClose();
    } catch (err) {
      console.error("Error adding quiz:", err);
      alert("Có lỗi khi thêm quiz");
    } finally {
      setSavingQuiz(false);
    }
  };

  const generateAIQuiz = async () => {
    if (!selectedLesson || !selectedLesson.content_url) {
      alert("Vui lòng chọn bài học có video URL");
      return;
    }

    try {
      setGeneratingAIQuiz(true);
      const payload = {
        course_id: course.id,
        lesson_id: selectedLesson.id,
        lesson_name: selectedLesson.title,
        video_url: selectedLesson.content_url,
        source_type:
          selectedLesson.content_url.includes("youtube") ||
          selectedLesson.content_url.includes("youtu.be")
            ? "youtube"
            : "cloudinary",
      };

      const aiResponse = await instructorService.generateAIQuiz(payload);

      if (aiResponse && aiResponse.quiz) {
        const generatedQuestions = aiResponse.quiz.map((q) => {
          const options = q.options || [];
          return {
            text: q.question || q.content || "",
            type: "multiple-choice",
            options: options.map((opt, idx) => ({
              text: opt,
              isCorrect: idx === q.correct_index,
            })),
            points: 1,
          };
        });

        setQuestions(generatedQuestions);
        setQuizTitle(`Quiz - ${selectedLesson.title}` || aiResponse.tag?.[0]);
        alert("Quiz được tạo bởi AI! Vui lòng kiểm tra và nhấn 'Lưu Quiz' để lưu.");
      }
    } catch (err) {
      console.error("Error generating AI quiz:", err);
      alert("Có lỗi khi tạo quiz AI. Vui lòng kiểm tra video URL.");
    } finally {
      setGeneratingAIQuiz(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-3xl max-h-[100vh] overflow-y-auto p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <FiX className="text-2xl" />
        </button>

        <h3 className="text-2xl font-bold mb-2 text-gray-800">
          Thêm Quiz vào bài học
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-medium text-blue-600">{selectedLesson?.title}</span>
        </p>

        {/* AI Generate Button */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={generateAIQuiz}
            disabled={generatingAIQuiz}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-medium"
          >
            {generatingAIQuiz ? (
              <>
                <FiLoader className="animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <span>🤖</span>
                Quizz with AI
              </>
            )}
          </button>
        </div>

        {/* Quiz Title */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tiêu đề Quiz
          </label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Ví dụ: Kiểm tra kiến thức cuối bài học"
          />
        </div>

        {/* Questions Section */}
        <div className="mb-6">
          <h4 className="font-bold text-gray-800 mb-4 text-lg">
            Câu hỏi ({questions.length})
          </h4>
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Câu {qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                      title="Xóa câu hỏi"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition"
                />

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Loại câu hỏi
                    </label>
                    <select
                      value={q.type || "multiple-choice"}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].type = e.target.value;
                        setQuestions(newQuestions);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="multiple-choice">Trắc nghiệm</option>
                      <option value="true-false">Đúng/Sai</option>
                      <option value="short-answer">Tự luận ngắn</option>
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Điểm
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={q.points || 1}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].points =
                          parseInt(e.target.value) || 1;
                        setQuestions(newQuestions);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {q.type === "multiple-choice" && (
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      Đáp án (chọn 1 đáp án đúng):
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={opt.isCorrect}
                            onChange={() => {
                              const newQuestions = [...questions];
                              newQuestions[qIndex].options.forEach(
                                (option, idx) => {
                                  newQuestions[qIndex].options[
                                    idx
                                  ].isCorrect = idx === oIndex;
                                }
                              );
                              setQuestions(newQuestions);
                            }}
                            className="cursor-pointer w-4 h-4"
                          />
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              updateOption(
                                qIndex,
                                oIndex,
                                "text",
                                e.target.value
                              )
                            }
                            placeholder={`Đáp án ${oIndex + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          />
                          {q.options.length > 1 && (
                            <button
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                              title="Xóa đáp án"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addOption(qIndex)}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded mt-2 transition flex items-center gap-1"
                    >
                      <FiPlus className="text-sm" /> Thêm đáp án
                    </button>
                  </div>
                )}

                {/* True/False Options */}
                {q.type === "true-false" && (
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      Chọn đáp án đúng:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`tf-${qIndex}`}
                          checked={
                            q.options[0]?.text === "Đúng" &&
                            q.options[0]?.isCorrect
                          }
                          onChange={() => {
                            const newQuestions = [...questions];
                            newQuestions[qIndex].options = [
                              { text: "Đúng", isCorrect: true },
                              { text: "Sai", isCorrect: false },
                            ];
                            setQuestions(newQuestions);
                          }}
                          className="cursor-pointer w-4 h-4"
                        />
                        <span className="text-gray-700">Đúng</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`tf-${qIndex}`}
                          checked={
                            q.options[1]?.text === "Sai" &&
                            q.options[1]?.isCorrect
                          }
                          onChange={() => {
                            const newQuestions = [...questions];
                            newQuestions[qIndex].options = [
                              { text: "Đúng", isCorrect: false },
                              { text: "Sai", isCorrect: true },
                            ];
                            setQuestions(newQuestions);
                          }}
                          className="cursor-pointer w-4 h-4"
                        />
                        <span className="text-gray-700">Sai</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Short Answer */}
                {q.type === "short-answer" && (
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      Đáp án đúng:
                    </p>
                    <input
                      type="text"
                      value={q.options[0]?.text || ""}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].options = [
                          { text: e.target.value, isCorrect: true },
                        ];
                        setQuestions(newQuestions);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="Nhập đáp án đúng..."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addQuestion}
            className="text-sm text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded mt-4 transition font-medium flex items-center gap-1"
          >
            <FiPlus className="text-sm" /> Thêm câu hỏi mới
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            disabled={savingQuiz}
          >
            Hủy
          </button>
          <button
            onClick={saveQuiz}
            disabled={savingQuiz}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
          >
            {savingQuiz ? (
              <>
                <FiLoader className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu Quiz"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddQuizModal;
