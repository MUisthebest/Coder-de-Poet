import React, { useState, useEffect } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import instructorService from "../../services/instructorService";

const CreateQuizPage = ({ lesson, course, quiz, onBack, onQuizCreated, onQuizUpdated }) => {
  const isEdit = !!quiz?.id;
  const [quizTitle, setQuizTitle] = useState(quiz?.title || "");
  const [description, setDescription] = useState(quiz?.description || "");
  const [duration, setDuration] = useState(quiz?.duration || 15);
  const [maxAttempts, setMaxAttempts] = useState(quiz?.maxAttempts || 1);
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
  const durationOptions = [5, 10, 15, 20, 30, 45, 60];

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

  // Normalize existing quiz into form state when editing
  useEffect(() => {
    if (quiz && quiz.questions) {
      setQuizTitle(quiz.title || "");
      setDescription(quiz.description || "");
      setDuration(quiz.duration || 15);
      setMaxAttempts(quiz.maxAttempts || 1);
      const mapped = quiz.questions.map((q) => {
        const optionsArray = Array.isArray(q.options) ? q.options : [];
        const rawCorrect = q.correct_answer ?? q.correctAnswer ?? "";
        const normCorrect = String(rawCorrect).trim().toLowerCase();

        const base = {
          text: q.content || q.text || "",
          type: q.type || "multiple-choice",
          points: q.points || 1,
        };

        if ((base.type || "").toLowerCase() === "true-false") {
          const isTrue = normCorrect === "true" || normCorrect === "đúng";
          return {
            ...base,
            options: [
              { text: "Đúng", isCorrect: isTrue },
              { text: "Sai", isCorrect: !isTrue },
            ],
          };
        }

        if ((base.type || "").toLowerCase() === "short-answer") {
          const ans = rawCorrect || (optionsArray[0] ?? "");
          return {
            ...base,
            options: [{ text: ans, isCorrect: true }],
          };
        }

        // multiple-choice default
        const normalizedOpts = optionsArray
          .map((o) => (typeof o === "string" ? o : String(o)))
          .filter((o) => o !== undefined && o !== null);
        let mappedOpts = normalizedOpts.map((opt) => ({
          text: opt,
          isCorrect: String(opt).trim().toLowerCase() === normCorrect,
        }));
        if (!mappedOpts.some((o) => o.isCorrect) && mappedOpts.length > 0) {
          // fallback: mark first as correct to satisfy validation
          mappedOpts[0].isCorrect = true;
        }
        if (mappedOpts.length === 0) {
          mappedOpts = [{ text: "", isCorrect: true }];
        }
        return { ...base, options: mappedOpts };
      });
      setQuestions(mapped.length ? mapped : questions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  const generateAIQuiz = async () => {
    if (!lesson || !lesson.content_url) {
      alert("Vui lòng chọn bài học có video URL");
      return;
    }

    try {
      setGeneratingAIQuiz(true);
      const payload = {
        course_id: course.id,
        lesson_id: lesson.id,
        lesson_name: lesson.title,
        video_url: lesson.content_url,
        source_type:
          lesson.content_url.includes("youtube") ||
          lesson.content_url.includes("youtu.be")
            ? "youtube"
            : "cloudinary",
      };

      const aiResponse = await instructorService.generateAIQuiz(payload);

      console.log("📊 AI Response received:", aiResponse);

      // Xử lý response: có thể là array trực tiếp hoặc object với quiz/questions
      let questionsData = [];
      let titleFromAI = "";

      if (Array.isArray(aiResponse)) {
        // Format: [{question, options, correct_index}, ...]
        questionsData = aiResponse;
      } else if (aiResponse && aiResponse.quiz) {
        // Format: {status: "done", quiz: [...], tag: [...]}
        questionsData = aiResponse.quiz;
        titleFromAI = aiResponse.title || "";
      } else if (aiResponse && aiResponse.questions) {
        // Format: {title: "...", questions: [...]}
        questionsData = aiResponse.questions;
        titleFromAI = aiResponse.title || "";
      }

      console.log("📝 Questions data extracted:", questionsData);

      if (questionsData.length > 0) {
        const generatedQuestions = questionsData.map((q) => {
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

        console.log("✅ Generated questions:", generatedQuestions);
        console.log("✅ Number of questions:", generatedQuestions.length);

        setQuestions(generatedQuestions);
        setQuizTitle(titleFromAI || `Quiz - ${lesson.title}`);
        
        // Delay alert để state có thời gian update
        setTimeout(() => {
          alert(`Quiz được tạo bởi AI với ${generatedQuestions.length} câu hỏi! Vui lòng kiểm tra và lưu.`);
        }, 100);
      } else {
        console.error("❌ No questions data found");
        alert("Không thể tạo quiz từ AI. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error generating AI quiz:", err);
      alert("Có lỗi khi tạo quiz AI. Vui lòng kiểm tra video URL.");
    } finally {
      setGeneratingAIQuiz(false);
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
      description,
      duration: Number(duration) || 15,
      maxAttempts: Number(maxAttempts) || 1,
      lessonId: lesson.id,
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
      if (isEdit && quiz?.id) {
        await instructorService.updateQuiz(quiz.id, {
          title: quizData.title,
          description: quizData.description,
          duration: quizData.duration,
          maxAttempts: quizData.maxAttempts,
          lessonId: lesson.id,
        });
        await instructorService.clearQuizQuestions(quiz.id);
        await instructorService.addQuestionsToQuiz(quiz.id, quizData.questions);
        alert("Quiz đã được cập nhật thành công!");
        onQuizUpdated?.({ id: quiz.id });
      } else {
        await instructorService.addQuizToLesson(lesson.id, quizData);
        alert("Quiz đã được thêm thành công!");
        onQuizCreated?.({ lessonId: lesson.id, quizData });
      }
      onBack();
    } catch (err) {
      console.error("Error adding quiz:", err);
      alert("Có lỗi khi lưu quiz");
    } finally {
      setSavingQuiz(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onBack}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FiX className="text-2xl" />
        </button>

        <h3 className="text-xl font-semibold mb-4">
          Thêm Quiz vào: <span className="text-blue-600">{lesson?.title}</span>
        </h3>

        <div className="mb-4 flex gap-2">
          <button
            onClick={generateAIQuiz}
            disabled={generatingAIQuiz}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {generatingAIQuiz ? "Đang tạo..." : "🤖 Tạo với AI"}
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề Quiz
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Kiểm tra kiến thức cuối bài"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả ngắn về quiz"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời lượng (phút)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {durationOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lần làm tối đa
              </label>
              <input
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="font-medium text-gray-800">Câu hỏi</h4>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) =>
                      updateQuestionText(qIndex, e.target.value)
                    }
                    placeholder={`Câu hỏi ${qIndex + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-gray-600">
                        Loại câu hỏi
                      </label>
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
                          newQuestions[qIndex].points =
                            parseInt(e.target.value) || 1;
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
                  <p className="text-sm text-gray-600 mb-2">
                    Đáp án (chọn 1 đáp án đúng):
                  </p>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[qIndex].options.forEach(
                            (option, idx) => {
                              newQuestions[qIndex].options[idx].isCorrect =
                                idx === oIndex;
                            }
                          );
                          setQuestions(newQuestions);
                        }}
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, "text", e.target.value)
                        }
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
                  <p className="text-sm text-gray-600 mb-2">
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
                      />
                      <span>Đúng</span>
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
                        { text: e.target.value, isCorrect: true },
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
            onClick={onBack}
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
  );
};

export default CreateQuizPage;
