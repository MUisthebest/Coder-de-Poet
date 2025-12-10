import React, { useState, useEffect } from "react";

const QuizPanel = ({ courseId, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút (600 giây)
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mock quiz data - bạn có thể thay thế bằng API call
  const mockQuizData = {
    courseId: courseId,
    title: "Bài kiểm tra cuối khóa",
    totalQuestions: 5,
    timeLimit: 600,
    passingScore: 60,
    questions: [
      {
        id: 1,
        question: "React là một thư viện JavaScript để làm gì?",
        options: [
          "Xây dựng giao diện người dùng",
          "Xây dựng backend server",
          "Quản lý cơ sở dữ liệu",
          "Xử lý hình ảnh"
        ],
        correctAnswer: 0,
        explanation: "React là thư viện JavaScript phổ biến để xây dựng UI."
      },
      {
        id: 2,
        question: "Hook nào dùng để quản lý state trong functional component?",
        options: [
          "useState",
          "useEffect",
          "useContext",
          "useReducer"
        ],
        correctAnswer: 0,
        explanation: "useState là hook cơ bản nhất để quản lý state."
      },
      {
        id: 3,
        question: "Props trong React là gì?",
        options: [
          "Dữ liệu chỉ đọc được truyền từ component cha",
          "Dữ liệu có thể thay đổi trong component",
          "Các hàm lifecycle",
          "Biến toàn cục"
        ],
        correctAnswer: 0,
        explanation: "Props là read-only data được truyền từ parent component."
      },
      {
        id: 4,
        question: "useEffect hook thay thế cho lifecycle methods nào?",
        options: [
          "componentDidMount, componentDidUpdate, componentWillUnmount",
          "componentWillMount, componentWillReceiveProps",
          "shouldComponentUpdate",
          "getDerivedStateFromProps"
        ],
        correctAnswer: 0,
        explanation: "useEffect kết hợp cả 3 lifecycle methods."
      },
      {
        id: 5,
        question: "Cách nào đúng để render điều kiện trong JSX?",
        options: [
          "Sử dụng ternary operator hoặc && operator",
          "Chỉ dùng if-else statement",
          "Dùng switch-case statement",
          "Không thể render điều kiện trong JSX"
        ],
        correctAnswer: 0,
        explanation: "Có thể dùng {condition && element} hoặc {condition ? a : b}."
      }
    ]
  };

  useEffect(() => {
    // Fetch quiz data từ API
    const fetchQuizData = async () => {
      setLoading(true);
      try {
        // Thay thế bằng API call thực tế
        // const response = await axios.get(`/api/courses/${courseId}/quiz`);
        // setQuizData(response.data);
        
        // Dùng mock data tạm thời
        setTimeout(() => {
          setQuizData(mockQuizData);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Lỗi tải quiz:", error);
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [courseId]);

  // Timer countdown
  useEffect(() => {
    if (quizCompleted || !quizData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
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

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      // Kiểm tra đáp án
      const currentQ = quizData.questions[currentQuestion];
      if (selectedAnswer === currentQ.correctAnswer) {
        setScore(prev => prev + 1);
      }

      // Chuyển câu hỏi tiếp theo
      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        handleSubmitQuiz();
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(null);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizCompleted(true);
    // Calculate final score
    const finalScore = (score / quizData.questions.length) * 100;
    
    // Gửi kết quả lên server
    // await axios.post(`/api/courses/${courseId}/quiz/submit`, {
    //   score: finalScore,
    //   answers: userAnswers
    // });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetryQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
    setTimeLeft(quizData?.timeLimit || 600);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <h3 className="text-xl font-bold text-red-600 mb-4">Lỗi tải bài kiểm tra</h3>
          <p className="text-gray-600 mb-4">Không thể tải bài kiểm tra. Vui lòng thử lại sau.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const finalScore = (score / quizData.questions.length) * 100;
  const passed = finalScore >= quizData.passingScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fff]/5 backdrop-blur-sm bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#456882] to-[#1B3C53] text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{quizData.title}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100">
                Câu hỏi {currentQuestion + 1}/{quizData.questions.length}
              </p>
              <div className="w-64 bg-blue-800 rounded-full h-2 mt-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
              <div className="text-blue-100 text-sm">Thời gian còn lại</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{quizData.passingScore}%</div>
              <div className="text-blue-100 text-sm">Điểm đạt</div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {quizCompleted ? (
            // Result Screen
            <div className="text-center py-8">
              <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-6 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className={`text-5xl ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? '✓' : '✗'}
                </span>
              </div>
              
              <h3 className={`text-3xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'Chúc mừng! Bạn đã đạt yêu cầu!' : 'Rất tiếc! Bạn chưa đạt yêu cầu'}
              </h3>
              
              <div className="text-4xl font-bold mb-2">{finalScore.toFixed(1)}%</div>
              <div className="text-gray-600 mb-6">
                {score} / {quizData.questions.length} câu trả lời đúng
              </div>
              
              <div className="flex justify-center gap-4 mt-8">
                {passed ? (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Hoàn thành
                  </button>
                ) : (
                  <button
                    onClick={handleRetryQuiz}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Làm lại bài kiểm tra
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Quay lại khóa học
                </button>
              </div>
            </div>
          ) : (
            // Question Screen
            <>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Câu {currentQuestion + 1}: {currentQ.question}
                </h3>
                
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswer === index
                          ? 'border-[#1B3C53] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                          selectedAnswer === index
                            ? 'border-blue-500 bg-[#1B3C53] text-white'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswer === index && '✓'}
                        </div>
                        <span className="text-gray-800">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                  className={`px-6 py-3 rounded-lg ${
                    currentQuestion === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  ← Câu trước
                </button>
                
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                  className={`px-6 py-3 rounded-lg ${
                    selectedAnswer === null
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#234C6A] text-white hover:bg-[#1B3C53]'
                  }`}
                >
                  {currentQuestion === quizData.questions.length - 1
                    ? 'Nộp bài'
                    : 'Câu tiếp theo →'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!quizCompleted && (
          <div className="bg-gray-50 border-t border-gray-200 p-4 text-center text-gray-600 text-sm">
            <p>📝 Lưu ý: Bạn có thể quay lại sửa đáp án trước khi nộp bài</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPanel;