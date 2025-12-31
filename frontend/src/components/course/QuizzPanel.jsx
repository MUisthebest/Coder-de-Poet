import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import courseService from '../../services/courseService';
import { useAuth } from "../../contexts/AuthContext";

const QuizPanel = ({ lessonId, courseId, videoUrl, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [quizData, setQuizData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendScore, setBackendScore] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState({});
  const { user } = useAuth();

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
        const quizzes = await courseService.getQuizzesByLesson(lessonId);
        console.log("quizzes response:", quizzes);

        if (!quizzes.length) throw new Error("Bài học chưa có quiz");

        const quiz = quizzes[0];

        const questions = quiz.questions.map((q, idx) => ({
          id: q.id,
          question: q.content,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: "Đáp án đúng: " + q.correct_answer,
          points: q.points || 0,
          type: q.type,
          orderIndex: q.order_index
        }));

        setQuizData({
          id: quiz.id,
          lessonId,
          title: quiz.title,
          totalQuestions: questions.length,
          timeLimit: quiz.duration * 60,
          passingScore: 80, // Điểm đạt 80%
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

  const fetchReviewData = async () => {
    if (!quizData?.id) return;

    setReviewLoading(true);
    try {
      const review = await courseService.getQuizzesByLessonForReview(lessonId);
      console.log("Review data:", review);

      // Tìm quiz phù hợp với quiz hiện tại
      const currentQuizReview = Array.isArray(review) 
        ? review.find(q => q.id === quizData.id)
        : review;

      if (currentQuizReview && currentQuizReview.questions) {
        setReviewData(currentQuizReview);
        
        // Tạo map để dễ dàng truy cập review question theo ID
        const reviewQuestionsMap = {};
        currentQuizReview.questions.forEach(q => {
          reviewQuestionsMap[q.id] = {
            correctAnswer: q.correct_answer,
            explanation: q.explanation || `Đáp án đúng: ${q.correct_answer}`
          };
        });
        
        setReviewData({
          ...currentQuizReview,
          questionsMap: reviewQuestionsMap
        });
      }
    } catch (err) {
      console.error("Error fetching review data:", err);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (quizCompleted && !reviewData) {
      fetchReviewData();
    }
  }, [quizCompleted, reviewData]);

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

      const result = await courseService.gradeSubmission(
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
    setReviewData(null);
    setShowReview(false);
    setShowCorrectAnswer({});
    setError("");
    setTimeLeft(quizData.timeLimit);
  };

  const handleToggleReview = () => {
    if (!showReview && !reviewData) {
      fetchReviewData();
    }
    setShowReview(!showReview);
  };

  const handleToggleCorrectAnswer = (questionId) => {
    setShowCorrectAnswer(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const getQuestionResult = (questionId) => {
    if (!userAnswers[questionId]) return 'not-answered';
    
    const question = quizData.questions.find(q => q.id === questionId);
    if (!question) return 'unknown';
    
    const userAnswer = userAnswers[questionId];
    const isCorrect = userAnswer === getCorrectAnswer(questionId);
    
    return isCorrect ? 'correct' : 'incorrect';
  };

  const getCorrectAnswer = (questionId) => {
    if (reviewData?.questionsMap?.[questionId]) {
      return reviewData.questionsMap[questionId].correctAnswer;
    }
    
    const question = quizData.questions.find(q => q.id === questionId);
    return question?.correct_answer || 'Không có đáp án';
  };

  const getExplanation = (questionId) => {
    if (reviewData?.questionsMap?.[questionId]) {
      return reviewData.questionsMap[questionId].explanation;
    }
    
    const question = quizData.questions.find(q => q.id === questionId);
    return question?.explanation || 'Không có giải thích';
  };

  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-semibold">Đang tải bài kiểm tra...</p>
          <p className="text-gray-500 mt-2">Vui lòng chờ</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !quizData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#456882] to-[#1B3C53] text-white p-6">
          <div className="flex justify-between items-center mb-1">
            <button onClick={onClose} className="text-3xl hover:opacity-70">
              ×
            </button>
            {quizCompleted && (
              <button
                onClick={handleToggleReview}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 flex items-center gap-2"
              >
                {showReview ? <FaEyeSlash /> : <FaEye />}
                {showReview ? "Ẩn đáp án" : "Xem đáp án"}
              </button>
            )}
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
            <div className="text-right">
              <div className="text-2xl font-bold">{quizData.passingScore}%</div>
              <div>Điểm đạt</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {quizCompleted ? (
            <div className="p-4">
              {submitting ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-xl font-semibold">Đang chấm điểm...</p>
                </div>
              ) : error ? (
                <div className="text-center py-16">
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
                </div>
              ) : (
                <>
                  <div className="text-center py-6 mb-8 border-b">
                    <div
                      className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-6xl mb-6 ${
                        backendScore?.isLessonCompleted ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {backendScore?.isLessonCompleted ? (
                        <FaCheckCircle className="text-green-600" size={80} />
                      ) : (
                        <FaTimesCircle className="text-red-600" size={80} />
                      )}
                    </div>
                    <h3 className={`text-4xl font-bold mb-4 ${
                      backendScore?.isLessonCompleted ? "text-green-600" : "text-red-600"
                    }`}>
                      {backendScore?.isLessonCompleted ? "Chúc mừng! Bạn đã ĐẠT!" : "Chưa đạt yêu cầu"}
                    </h3>
                    <p className="text-5xl font-bold text-gray-800 mb-2">
                      {backendScore?.percent?.toFixed(0) || finalScore.toFixed(0)}%
                    </p>
                    <p className="text-xl text-gray-600 mb-2">
                      {backendScore?.totalScore || score} / {quizData.totalQuestions} câu đúng
                    </p>
                    <p className="text-lg text-gray-500">
                      Điểm đạt: {quizData.passingScore}%
                    </p>
                  </div>

                  {showReview && (
                    <div className="mb-8">
                      <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <FaEye />
                        Đáp án và giải thích
                      </h4>
                      
                      {reviewLoading ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-2 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                          <p>Đang tải đáp án...</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {quizData.questions.map((question, index) => {
                            const result = getQuestionResult(question.id);
                            const isShowing = showCorrectAnswer[question.id];
                            
                            return (
                              <div
                                key={question.id}
                                className={`p-6 rounded-xl border-2 ${
                                  result === 'correct'
                                    ? 'border-green-200 bg-green-50'
                                    : result === 'incorrect'
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h5 className="text-lg font-semibold text-gray-800">
                                      Câu {index + 1}: {question.question}
                                    </h5>
                                    <div className="flex items-center gap-4 mt-2">
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        result === 'correct'
                                          ? 'bg-green-100 text-green-800'
                                          : result === 'incorrect'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {result === 'correct' ? 'Đúng' : 
                                         result === 'incorrect' ? 'Sai' : 
                                         'Chưa trả lời'}
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        Điểm: {question.points}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleToggleCorrectAnswer(question.id)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                                  >
                                    {isShowing ? <FaEyeSlash /> : <FaEye />}
                                    {isShowing ? 'Ẩn' : 'Xem'}
                                  </button>
                                </div>

                                <div className="mb-4">
                                  <p className="font-medium text-gray-700 mb-2">Câu trả lời của bạn:</p>
                                  <p className={`p-3 rounded-lg ${
                                    result === 'correct'
                                      ? 'bg-green-100 text-green-800'
                                      : result === 'incorrect'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {userAnswers[question.id] || 'Chưa trả lời'}
                                  </p>
                                </div>

                                {isShowing && (
                                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="font-medium text-blue-800 mb-2">Đáp án đúng:</p>
                                    <p className="text-blue-700 bg-white p-3 rounded-lg border border-blue-300">
                                      {getCorrectAnswer(question.id)}
                                    </p>
                                    <div className="mt-3">
                                      <p className="font-medium text-blue-800 mb-2">Giải thích:</p>
                                      <p className="text-gray-700">
                                        {getExplanation(question.id)}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-4">
                                  <p className="font-medium text-gray-700 mb-2">Các lựa chọn:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {question.options.map((option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className={`p-3 rounded-lg border ${
                                          option === getCorrectAnswer(question.id)
                                            ? 'border-green-400 bg-green-50 text-green-800'
                                            : option === userAnswers[question.id] && option !== getCorrectAnswer(question.id)
                                            ? 'border-red-400 bg-red-50 text-red-800'
                                            : 'border-gray-300 bg-gray-50 text-gray-700'
                                        }`}
                                      >
                                        <div className="flex items-center">
                                          <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                            option === getCorrectAnswer(question.id)
                                              ? 'border-green-500 bg-green-500 text-white'
                                              : option === userAnswers[question.id] && option !== getCorrectAnswer(question.id)
                                              ? 'border-red-500 bg-red-500 text-white'
                                              : 'border-gray-400'
                                          }`}>
                                            {option === getCorrectAnswer(question.id) && <FaCheckCircle size={12} />}
                                            {option === userAnswers[question.id] && option !== getCorrectAnswer(question.id) && <FaTimesCircle size={12} />}
                                          </div>
                                          {option}
                                          {option === getCorrectAnswer(question.id) && (
                                            <span className="ml-2 text-green-600 text-sm font-medium">(Đáp án đúng)</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-center gap-6 pt-6 border-t">
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
                    {!showReview && (
                      <button
                        onClick={handleToggleReview}
                        className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg flex items-center gap-2"
                      >
                        <FaEye />
                        Xem đáp án
                      </button>
                    )}
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
                        {String.fromCharCode(65 + i)}
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
                  Câu trước
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