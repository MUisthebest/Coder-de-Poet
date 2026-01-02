import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Star } from "lucide-react";
import courseService from "../../services/courseService";

const ReviewPage = ({ courseId, onBack }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const courseReviews = await courseService.getReviewsByCourse(courseId);
      const avg = courseService.calculateAverageRating(courseReviews);
      setReviews(courseReviews);
      setAverageRating(avg);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchReviews();
    }
  }, [courseId]);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              <FiArrowLeft /> Back
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Course Reviews</h1>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {averageRating}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    size={24}
                    className="text-yellow-500"
                    fill={idx < Math.round(averageRating) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="text-gray-600">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Rating Distribution */}
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
        </div>

        {/* Reviews List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Reviews</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 text-lg">No reviews yet for this course</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews
                .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
                .map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Rating Stars */}
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                size={16}
                                className="text-yellow-500"
                                fill={idx < Number(review.rating || 0) ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {review.createdAt || review.created_at
                            ? new Date(review.createdAt || review.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Unknown date"}
                        </p>
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {review.comment}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
