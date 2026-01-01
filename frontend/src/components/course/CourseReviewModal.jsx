import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import courseService from "../../services/courseService";

const CourseReviewModal = ({ isOpen, onClose, courseId, user, isEnrolled, onReviewSubmitted }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
      const courseReviews = await courseService.getReviewsByCourse(courseId);
      const normalizedReviews = courseReviews.map(normalizeReview);
      const avg = courseService.calculateAverageRating(normalizedReviews);
      setReviews(normalizedReviews);
      setAverageRating(avg);
      setReviewError(null);
    } catch (err) {
      console.error("Error fetching reviews", err);
      setReviewError("Unable to load reviews. Please try again later.");
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
    
    // Validation
    if (!courseId) {
      alert("No course information available. Please reload the page.");
      return;
    }
    if (!user) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    
    // Get userId from possible fields
    const userId = user.id || user.userId || user.nameid || user.sub;
    if (!userId) {
      console.error("User ID not found in user object:", user);
      alert("Error: Unable to identify user. Please log in again.");
      return;
    }
    
    if (!isEnrolled) {
      alert("You need to enroll in this course before reviewing.");
      return;
    }
    if (!commentInput.trim()) {
      alert("Please enter your review.");
      return;
    }
    
    try {
      setSubmittingReview(true);
      const reviewData = {
        courseId: String(courseId),
        userId: String(userId),
        rating: Number(ratingInput),
        comment: commentInput.trim(),
      };
      
      console.log("Submitting review:", reviewData);
      
      await courseService.createReview(reviewData);
      setCommentInput("");
      setRatingInput(5);
      await fetchReviews();

      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error("Failed to submit review", err);
      alert("Unable to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm text-gray-500">Course Reviews</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">{averageRating || 0}</span>
              <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Rating Distribution */}
        {reviews.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter((r) => Number(r.rating) === rating).length;
                const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3 mb-3 last:mb-0">
                    <span className="text-sm font-medium text-gray-600 w-8">{rating}</span>
                    <div className="flex items-center gap-1 flex-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={14}
                          className="text-yellow-500"
                          fill={idx < rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isEnrolled ? (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Rating:</label>
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
                placeholder="Share your thoughts about this course..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                disabled={submittingReview}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-blue-800 font-medium">You need to enroll in this course to write a review</p>
            <p className="text-blue-600 text-sm mt-2">Check out the reviews below to learn more about this course!</p>
          </div>
        )}

        <div className="space-y-4 pt-2">
          {reviewLoading && <p className="text-gray-500">Loading reviews...</p>}
          {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
          {!reviewLoading && !reviews.length && !reviewError && (
            <p className="text-gray-500">No reviews yet for this course.</p>
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
