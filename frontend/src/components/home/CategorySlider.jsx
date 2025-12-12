import { useRef, useState, useEffect } from "react";

export default function CategorySlider({ categories, activeCategory, setActiveCategory }) {
  const scrollContainerRef = useRef(null);
  const [showLeftBlur, setShowLeftBlur] = useState(false);
  const [showRightBlur, setShowRightBlur] = useState(true);

  // Kiểm tra scroll position để hiển thị blur
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // Hiển thị blur bên trái nếu đã scroll sang phải
      setShowLeftBlur(scrollLeft > 10);
      
      // Hiển thị blur bên phải nếu còn content để scroll
      setShowRightBlur(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Thêm event listener cho scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Kiểm tra ngay khi mount
      checkScroll();
      
      return () => {
        container.removeEventListener('scroll', checkScroll);
      };
    }
  }, [categories]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full relative">
      {/* Blur overlays - nằm dưới các nút điều hướng nhưng trên content */}
      {showLeftBlur && (
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      )}

      {showRightBlur && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      )}

      {/* Nút điều hướng - z-index cao hơn blur */}
      <div className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={scrollLeft}
          className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          aria-label="Scroll left"
          disabled={!showLeftBlur}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={scrollRight}
          className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          aria-label="Scroll right"
          disabled={!showRightBlur}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scroll container - z-index thấp nhất */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-3 px-8 md:px-12
                   snap-x snap-mandatory scroll-pl-6
                   [-ms-overflow-style:'none'] [scrollbar-width:'none']
                   [&::-webkit-scrollbar]:hidden
                   relative z-0"  // Đảm bảo z-0 thấp hơn blur (z-10)
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.name)}
            className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-full border transition-all duration-200
              snap-start
              ${
                activeCategory === category.name
                  ? "bg-[#333] text-white border-white shadow-md relative z-30"  // Tăng z-index khi active
                  : "bg-[#E3E3E3] text-gray-700 border-gray-300 hover:border-gray-500 hover:shadow-sm relative z-0"
              }`}
          >
            <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0
              ${activeCategory === category.name ? 'bg-white' : 'bg-white'}`}>
              <img
                src={category.image}
                alt={category.name}
                className="h-5 w-5 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23ccc"/></svg>';
                }}
              />
            </div>
            <span className="font-semibold whitespace-nowrap text-sm">
              {category.name}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile scroll hint */}
      <div className="text-center mt-2 md:hidden">
        <p className="text-xs text-gray-500 animate-pulse">← Kéo để xem thêm →</p>
      </div>
    </div>
  );
}