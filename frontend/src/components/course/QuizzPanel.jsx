import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import courseService from '../../services/courseService';
import { useAuth } from "../../contexts/AuthContext";

const QuizPanel = ({ lessonId, courseId, videoUrl, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [backendScore, setBackendScore] = useState(null);
  const {user} = useAuth();

 useEffect(() => {
  const fetchQuiz = async () => {
    console.log("fetchQuiz called, lessonId:", lessonId);
    if (!lessonId) {
      console.log("lessonId is empty, returning");
      setError("lessonId không hợp lệ");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("KKK");
      const quizzes = await courseService.getQuizzesByLesson(lessonId);
      console.log("quizzes response:", quizzes);
      
      if (!quizzes.length) throw new Error("Bài học chưa có quiz");

      // Lấy quiz đầu tiên (hoặc bạn có thể cho chọn)
      const quiz = quizzes[0];

      const questions = quiz.questions.map((q, idx) => ({
        id: q.id,
        question: q.content,
        options: q.options,
        correctAnswer: q.options.findIndex(
          (opt) => opt === q.correct_answer
        ),
        explanation: "Đáp án đúng: " + q.correct_answer,
      }));

      setQuizData({
        lessonId,
        title: quiz.title,
        totalQuestions: questions.length,
        timeLimit: quiz.duration * 60,
        passingScore: 70,
        questions,
      });

      setTimeLeft(quiz.duration * 60);
    } catch (err) {
      setError(err.message || "Lỗi khi tải quiz");
    } finally {
      setLoading(false);
    }
  };

  fetchQuiz();
}, [lessonId]);

  // Parse text từ GPT thành mảng câu hỏi chuẩn
  const parseQuizFromText = (text) => {
    const questions = [];
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    let current = null;
    let correctIdx = -1;

    for (const line of lines) {
      if (/^(\d+\.|Câu\s*\d+:|Question\s*\d+:)/i.test(line)) {
        if (current && correctIdx !== -1) {
          current.correctAnswer = correctIdx;
          questions.push(current);
        }
        current = {
          id: questions.length + 1,
          question: line.replace(/^(\d+\.|Câu\s*\d+:|Question\s*\d+:)\s*/i, "").trim(),
          options: [],
          explanation: "Tạo tự động bằng AI từ nội dung video",
        };
        correctIdx = -1;
      } else if (/^[ABCD][\.\)]\s/.test(line)) {
        const opt = line.replace(/^[ABCD][\.\)]\s*/, "").trim();
        current.options.push(opt);

        // Phát hiện đáp án đúng
        if (/\(correct|đúng|✓|\*\*/i.test(line) || line.toLowerCase().includes("correct")) {
          correctIdx = current.options.length - 1;
        }
      }
    }

    if (current && correctIdx !== -1) {
      current.correctAnswer = correctIdx;
      questions.push(current);
    }

    return questions;
  };

  // Timer
  useEffect(() => {
    if (quizCompleted || !quizData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizCompleted, quizData]);

  const handleNext = () => {
    if (selectedAnswer === null) return;

    // Record user's answer
    const questionId = quizData.questions[currentQuestion].id.toString();
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: quizData.questions[currentQuestion].options[selectedAnswer]
    }));

    if (selectedAnswer === quizData.questions[currentQuestion].correctAnswer) {
      setScore((s) => s + 1);
    }

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((c) => c - 1);
      setSelectedAnswer(null);
    }
  };

  const handleSubmitQuiz = async () => {
    // Record the last answer before submitting
    if (selectedAnswer !== null) {
      const questionId = quizData.questions[currentQuestion].id.toString();
      userAnswers[questionId] = quizData.questions[currentQuestion].options[selectedAnswer];
    }

    setSubmitting(true);
    try {
      const studentId = user?.id;

      if (!studentId) {
        throw new Error('Student ID not found');
      }

      // Call backend grading endpoint
      const result = await courseService.gradeQuizSubmission(
        studentId,
        lessonId,
        courseId,
        userAnswers
      );

      console.log('Grading result:', result);
      setBackendScore(result);
      setQuizCompleted(true);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Lỗi khi nộp bài: ' + (err.message || 'Unknown error'));
      setQuizCompleted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setUserAnswers({});
    setScore(0);
    setBackendScore(null);
    setQuizCompleted(false);
    setError("");
    setTimeLeft(quizData.timeLimit);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-semibold">Đang phân tích video và tạo câu hỏi bằng AI...</p>
          <p className="text-gray-500 mt-2">Vui lòng chờ 1-3 phút</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !quizData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">Warning</div>
          <h3 className="text-2xl font-bold text-red-600 mb-4">Không thể tạo bài kiểm tra</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const q = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const finalScore = (score / quizData.questions.length) * 100;
  const passed = finalScore >= quizData.passingScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#456882] to-[#1B3C53] text-white p-6">
          <div className="flex justify-between items-center mb-1">
            <button onClick={onClose} className="text-3xl hover:opacity-70">
              ×
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <p>Câu {currentQuestion + 1} / {quizData.questions.length}</p>
              <div className="w-64 bg-white/30 rounded-full h-3 mt-2">
                <div
                  className="bg-white h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
              <div>Thời gian còn lại</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{quizData.passingScore}%</div>
              <div>Điểm đạt</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {quizCompleted ? (
            <div className="text-center py-16">
              {submitting ? (
                <>
                  <div className="w-16 h-16 border-4 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-xl font-semibold">Đang chấm điểm...</p>
                </>
              ) : error ? (
                <>
                  <div className="text-6xl mb-4 text-red-600">⚠️</div>
                  <h3 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <div className="flex justify-center gap-6">
                    <button
                      onClick={handleRetry}
                      className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-lg"
                    >
                      Làm lại
                    </button>
                    <button
                      onClick={onClose}
                      className="px-8 py-4 bg-gray-200 rounded-xl hover:bg-gray-300 font-bold text-lg"
                    >
                      Đóng
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-6xl mb-8 ${
                      backendScore?.isLessonCompleted ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                  {backendScore?.isLessonCompleted ? (
                    <FaCheckCircle color="green" size={80} />
                  ) : (
                    <FaTimesCircle color="red" size={80} />
                  )}
                  </div>
                  <h3 className={`text-4xl font-bold mb-4 ${backendScore?.isLessonCompleted ? "text-green-600" : "text-red-600"}`}>
                    {backendScore?.isLessonCompleted ? "Chúc mừng! Bạn đã ĐẠT!" : "Chưa đạt yêu cầu"}
                  </h3>
                  <p className="text-5xl font-bold text-gray-800 mb-2">{backendScore?.score || finalScore.toFixed(0)}%</p>
                  <p className="text-xl text-gray-600 mb-10">
                    {backendScore?.correctAnswers || score} / {quizData.questions.length} câu đúng
                  </p>
                  {backendScore?.feedback && (
                    <p className="text-lg text-gray-700 mb-8 p-4 bg-blue-50 rounded-lg">
                      {backendScore.feedback}
                    </p>
                  )}
                  <div className="flex justify-center gap-6">
                    <button
                      onClick={handleRetry}
                      className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-lg"
                    >
                      Làm lại
                    </button>
                    <button
                      onClick={onClose}
                      className="px-8 py-4 bg-gray-200 rounded-xl hover:bg-gray-300 font-bold text-lg"
                    >
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-gray-800 mb-5">
                Câu {currentQuestion + 1}: {q.question}
              </h3>

              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAnswer(i)}
                    className={`w-full text-left p-5 rounded-xl border-2 text-lg transition-all
                      ${selectedAnswer === i
                        ? "border-[#1B3C53] bg-blue-50 shadow-lg"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full border-2 mr-4 flex items-center justify-center font-bold
                          ${selectedAnswer === i ? "bg-[#1B3C53] text-white" : "border-gray-400"}`}
                      >
                        {selectedAnswer === i ? <FaCheckCircle color="green" size={20} /> : String.fromCharCode(65 + i)}
                      </div>
                      <span>{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestion === 0}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    currentQuestion === 0
                      ? "bg-gray-100 text-gray-400"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Previous Question
                </button>

                <button
                  onClick={handleNext}
                  disabled={selectedAnswer === null || submitting}
                  className={`px-8 py-4 rounded-lg font-bold text-white ${
                    selectedAnswer === null || submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#1B3C53] hover:bg-[#162f42]"
                  }`}
                >
                  {submitting ? "Đang nộp..." : currentQuestion === quizData.questions.length - 1 ? "Nộp bài" : "Tiếp theo"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPanel;