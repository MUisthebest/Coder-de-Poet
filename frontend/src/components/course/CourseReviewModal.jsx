import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import { authService } from "../../services/authService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const CourseReviewModal = ({ isOpen, onClose, courseId, user, isEnrolled, onReviewSubmitted }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const getAccessToken = () => authService.getStoredToken();

  const normalizeReview = (r) => ({
    id: r.id,
    courseId: r.courseId ?? r.course_id,
    userId: r.userId ?? r.user_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt ?? r.created_at,
  });

  const fetchReviews = async () => {
    try {
      setReviewLoading(true);
      const token = getAccessToken();
      const res = await axios.get(`${API_URL}/reviews`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const data = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.reviews || [];
      const courseReviews = data.map(normalizeReview).filter((r) => String(r.courseId) === String(courseId));
      const avg = courseReviews.length ? courseReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / courseReviews.length : 0;
      setReviews(courseReviews);
      setAverageRating(Number(avg.toFixed(1)));
      setReviewError(null);
    } catch (err) {
      console.error("Error fetching reviews", err);
      setReviewError("Không thể tải đánh giá. Vui lòng thử lại sau.");
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, courseId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    if (!isEnrolled) {
      alert("Bạn cần đăng ký khóa học trước khi đánh giá.");
      return;
    }
    if (!commentInput.trim()) {
      alert("Vui lòng nhập nhận xét của bạn.");
      return;
    }
    try {
      setSubmittingReview(true);
      const token = getAccessToken();
      await axios.post(
        `${API_URL}/reviews`,
        {
          courseId: Number(courseId),
          userId: Number(user.id),
          rating: Number(ratingInput),
          comment: commentInput.trim(),
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      setCommentInput("");
      setRatingInput(5);
      await fetchReviews();
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error("Gửi đánh giá thất bại", err);
      alert("Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Đánh giá khóa học</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">{averageRating || 0}</span>
              <div className="flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={20} fill={idx < Math.round(averageRating) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-sm text-gray-500">({reviews.length} đánh giá)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none"
            aria-label="Đóng"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Chấm điểm:</label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const value = idx + 1;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setRatingInput(value)}
                    className={`transition-transform ${value <= ratingInput ? "text-yellow-500" : "text-gray-300"}`}
                  >
                    <Star size={28} fill={value <= ratingInput ? "currentColor" : "none"} />
                  </button>
                );
              })}
            </div>
            <span className="text-sm text-gray-500">{ratingInput}/5</span>
          </div>

          <div>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              rows={4}
              placeholder={isEnrolled ? "Chia sẻ cảm nhận của bạn về khóa học..." : "Đăng ký khóa học để có thể viết đánh giá."}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              disabled={!isEnrolled || submittingReview}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isEnrolled || submittingReview}
              className={`px-5 py-2 rounded-xl text-white font-medium ${!isEnrolled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} transition-colors duration-200`}
            >
              {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>

        <div className="space-y-4 pt-2">
          {reviewLoading && <p className="text-gray-500">Đang tải đánh giá...</p>}
          {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
          {!reviewLoading && !reviews.length && !reviewError && (
            <p className="text-gray-500">Chưa có đánh giá nào cho khóa học này.</p>
          )}
          {reviews.map((rev) => (
            <div key={rev.id} className="border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={16} fill={idx < Number(rev.rating || 0) ? "currentColor" : "none"} />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{rev.rating}/5</span>
                </div>
                <span className="text-xs text-gray-400">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ""}</span>
              </div>
              <p className="mt-2 text-gray-800 whitespace-pre-line">{rev.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseReviewModal;
