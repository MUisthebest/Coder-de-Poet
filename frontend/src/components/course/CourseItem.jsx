import { NavLink } from "react-router-dom";
import { getThumbnailUrl } from "../../utils/thumbnailHelper";
  const getPopularTags = (courseTags, limit = 3) => {
    if (!courseTags || !Array.isArray(courseTags)) return [];
    const uniqueTags = [...new Set(courseTags)];
    return uniqueTags.slice(0, limit);
  };

  const formatTag = (tag) => {
    if (!tag) return '';
    const formatted = tag.replace(/-/g, ' ');
    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

const CourseItem = ({ course }) => {
  const {
    id,
    title,
    thumbnail_url,
    student_count,
    tag,
    access_type,
    status,
    category_id // bạn có thể map sau nếu có danh sách category
  } = course;

  // Giả lập rating ngẫu nhiên từ 3.5 - 5.0 (vì API chưa có)
  const rating = (Math.random() * 1.5 + 3.5).toFixed(1);

  // Giá: free thì 0, premium thì random $10-$20
  const price = access_type === 'free' ? 0 : (Math.floor(Math.random() * 10) + 10).toFixed(2);

  return (
<NavLink to={`/courses/${course.id}`}
  className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group">
  
  <div className="relative">
    <img
      src={getThumbnailUrl(thumbnail_url)}
      alt={title}
      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
      onError={(e) => {
        e.target.src = thumbnail_url.includes('ytimg.com')
          ? thumbnail_url
          : `https://img.youtube.com/vi/${thumbnail_url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1] || 'dQw4w9WgXcQ'}/hqdefault.jpg`;
      }}
    />
    {access_type === 'free' ? (
      <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
        FREE
      </span>
    ) : (
      <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
        PREMIUM
      </span>
    )}
  </div>

  <div className="p-5">
    <div className="mb-3">
      <div className="flex flex-wrap gap-1.5">
        {getPopularTags(course.tag, 2).map((tag, tagIndex) => (
          <span 
            key={tagIndex} 
            className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-600 font-medium border border-gray-200"
          >
            #{formatTag(tag)}
          </span>
        ))}
        
        {course.tags && course.tags.length > 2 && (
          <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium border border-gray-200">
            +{course.tags.length - 2}
          </span>
        )}
      </div>
    </div>

    <h3
      className="font-bold text-lg text-gray-900 truncate mb-3 group-hover:text-purple-600 transition"
    >
      {title.length > 15 ? title.slice(0, 36) + "..." : title}
    </h3>

    <div className="flex justify-between items-center mt-4">
      <div className="flex items-center gap-2 text-gray-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15.5 8.5 0"/>
        </svg>
        <span className="text-sm font-medium">{student_count.toLocaleString()} học viên</span>
      </div>
    </div>
  </div>
</NavLink>
  );
};

export default CourseItem;