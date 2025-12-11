/**
 * Utility functions for handling thumbnails from various sources
 * Supports: YouTube, Vimeo, Pinterest, Imgur, Unsplash, direct image URLs, etc.
 */

// Cache để tăng performance
const thumbnailCache = new Map();
const DEFAULT_THUMBNAIL = 'https://placehold.co/600x400/3b82f6/ffffff?text=No+Thumbnail';
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Xóa cache cũ
 */
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of thumbnailCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      thumbnailCache.delete(key);
    }
  }
};

/**
 * Kiểm tra URL có hợp lệ không
 */
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Kiểm tra xem URL có phải là ảnh trực tiếp không
 */
const isDirectImageUrl = (url) => {
  const urlLower = url.toLowerCase();
  
  // Kiểm tra extension ảnh
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  if (imageExtensions.some(ext => urlLower.includes(ext))) {
    return true;
  }
  
  // Kiểm tra các domain hosting ảnh phổ biến
  const imageHostingDomains = [
    'pinimg.com',
    'imgur.com',
    'i.imgur.com',
    'cdn.discordapp.com',
    'cloudinary.com',
    'images.unsplash.com',
    'graph.facebook.com',
    'i.redd.it',
    'media.tenor.com',
    'lh3.googleusercontent.com',
    'avatars.githubusercontent.com',
    'picsum.photos',
    'source.unsplash.com',
    'placehold.co',
    'placehold.it',
    'via.placeholder.com',
    'loremflickr.com',
    'dummyimage.com',
  ];
  
  return imageHostingDomains.some(domain => urlLower.includes(domain));
};

/**
 * Trích xuất YouTube video ID từ URL
 */
const extractYouTubeId = (url) => {
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Chỉ có video ID
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Trích xuất Vimeo video ID từ URL
 */
const extractVimeoId = (url) => {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/channels\/[^/]+\/(\d+)/,
    /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/,
    /vimeo\.com\/ondemand\/[^/]+\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Tạo URL thumbnail cho các dịch vụ khác
 */
const getServiceThumbnail = (url) => {
  const urlLower = url.toLowerCase();
  
  // Facebook
  if (urlLower.includes('facebook.com')) {
    // Facebook video
    const fbVideoMatch = url.match(/facebook\.com\/.*\/video\/(\d+)/);
    if (fbVideoMatch) {
      return `https://graph.facebook.com/${fbVideoMatch[1]}/picture`;
    }
    
    // Facebook post/photo
    const fbPhotoMatch = url.match(/facebook\.com\/photo(?:\/s)?\?fbid=(\d+)/);
    if (fbPhotoMatch) {
      return `https://graph.facebook.com/${fbPhotoMatch[1]}/picture`;
    }
  }
  
  // TikTok
  if (urlLower.includes('tiktok.com')) {
    return 'https://placehold.co/600x400/ff0050/ffffff?text=TikTok+Video';
  }
  
  // Instagram
  if (urlLower.includes('instagram.com')) {
    return 'https://placehold.co/600x400/e4405f/ffffff?text=Instagram';
  }
  
  // Twitter/X
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'https://placehold.co/600x400/1da1f2/ffffff?text=Twitter';
  }
  
  // LinkedIn
  if (urlLower.includes('linkedin.com')) {
    return 'https://placehold.co/600x400/0a66c2/ffffff?text=LinkedIn';
  }
  
  // Dailymotion
  if (urlLower.includes('dailymotion.com') || urlLower.includes('dai.ly')) {
    const dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/) || 
                    url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
    if (dmMatch) {
      return `https://www.dailymotion.com/thumbnail/video/${dmMatch[1]}`;
    }
  }
  
  // Twitch
  if (urlLower.includes('twitch.tv')) {
    const twitchMatch = url.match(/twitch\.tv\/[^/]+\/clip\/([a-zA-Z0-9_-]+)/) ||
                       url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/);
    if (twitchMatch) {
      return `https://clips-media-assets2.twitch.tv/${twitchMatch[1]}-preview.jpg`;
    }
  }
  
  return null;
};

/**
 * Hàm chính để lấy thumbnail URL từ bất kỳ URL nào
 * @param {string} url - URL cần lấy thumbnail
 * @param {Object} options - Tùy chọn
 * @param {string} options.defaultThumbnail - Thumbnail mặc định nếu không tìm được
 * @param {boolean} options.useCache - Có sử dụng cache không (mặc định: true)
 * @param {string} options.youtubeQuality - Chất lượng YouTube thumbnail (maxresdefault, hqdefault, mqdefault, sddefault)
 * @returns {string} URL thumbnail
 */
export const getThumbnailUrl = (url, options = {}) => {
  // Xóa cache cũ định kỳ
  if (Math.random() < 0.1) { // 10% chance để clean cache
    cleanCache();
  }
  
  // Xử lý options
  const {
    defaultThumbnail = DEFAULT_THUMBNAIL,
    useCache = true,
    youtubeQuality = 'maxresdefault',
  } = options;
  
  // Nếu không có URL, trả về mặc định
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return defaultThumbnail;
  }
  
  const cleanedUrl = url.trim();
  
  // Kiểm tra cache
  if (useCache && thumbnailCache.has(cleanedUrl)) {
    const cached = thumbnailCache.get(cleanedUrl);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.url;
    }
    thumbnailCache.delete(cleanedUrl);
  }
  
  let result;
  
  // 1. Kiểm tra URL hợp lệ
  if (!isValidUrl(cleanedUrl)) {
    result = defaultThumbnail;
  }
  // 2. Nếu đã là URL ảnh trực tiếp
  else if (isDirectImageUrl(cleanedUrl)) {
    result = cleanedUrl;
  }
  // 3. Kiểm tra YouTube
  else if (cleanedUrl.includes('youtube') || cleanedUrl.includes('youtu.be')) {
    const youtubeId = extractYouTubeId(cleanedUrl);
    if (youtubeId) {
      result = `https://img.youtube.com/vi/${youtubeId}/${youtubeQuality}.jpg`;
    } else {
      result = defaultThumbnail;
    }
  }
  // 4. Kiểm tra Vimeo
  else if (cleanedUrl.includes('vimeo.com')) {
    const vimeoId = extractVimeoId(cleanedUrl);
    if (vimeoId) {
      result = `https://vumbnail.com/${vimeoId}.jpg`;
    } else {
      result = defaultThumbnail;
    }
  }
  // 5. Kiểm tra các dịch vụ khác
  else {
    const serviceThumbnail = getServiceThumbnail(cleanedUrl);
    result = serviceThumbnail || cleanedUrl;
  }
  
  // Lưu vào cache
  if (useCache) {
    thumbnailCache.set(cleanedUrl, {
      url: result,
      timestamp: Date.now(),
    });
  }
  
  return result;
};

/**
 * Hàm kiểm tra xem URL có phải là video không
 * @param {string} url - URL cần kiểm tra
 * @returns {boolean}
 */
export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const urlLower = url.toLowerCase();
  
  const videoDomains = [
    'youtube.com',
    'youtu.be',
    'vimeo.com',
    'dailymotion.com',
    'dai.ly',
    'twitch.tv',
    'facebook.com/video',
    'tiktok.com',
    'vimeo.com',
    'streamable.com',
    'wistia.com',
  ];
  
  return videoDomains.some(domain => urlLower.includes(domain));
};

/**
 * Hàm lấy loại nội dung từ URL
 * @param {string} url - URL cần kiểm tra
 * @returns {string} 'image', 'video', 'unknown'
 */
export const getContentType = (url) => {
  if (!url || typeof url !== 'string') return 'unknown';
  
  if (isDirectImageUrl(url)) {
    return 'image';
  }
  
  if (isVideoUrl(url)) {
    return 'video';
  }
  
  return 'unknown';
};

/**
 * Hàm tạo thumbnail với kích thước tùy chỉnh (chỉ cho placeholder)
 * @param {Object} options - Tùy chọn
 * @param {number} options.width - Chiều rộng
 * @param {number} options.height - Chiều cao
 * @param {string} options.text - Chữ trên placeholder
 * @param {string} options.bgColor - Màu nền (hex không có #)
 * @param {string} options.textColor - Màu chữ (hex không có #)
 * @returns {string} URL placeholder
 */
export const getPlaceholderThumbnail = (options = {}) => {
  const {
    width = 600,
    height = 400,
    text = 'No Thumbnail',
    bgColor = '3b82f6',
    textColor = 'ffffff',
  } = options;
  
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`;
};

/**
 * Hàm xóa toàn bộ cache
 */
export const clearThumbnailCache = () => {
  thumbnailCache.clear();
};

/**
 * Hàm lấy thông tin cache
 * @returns {Object} Thông tin cache
 */
export const getCacheInfo = () => {
  return {
    size: thumbnailCache.size,
    entries: Array.from(thumbnailCache.entries()).map(([key, value]) => ({
      key,
      url: value.url,
      age: Date.now() - value.timestamp,
    })),
  };
};

// Export mặc định
export default {
  getThumbnailUrl,
  isVideoUrl,
  getContentType,
  getPlaceholderThumbnail,
  clearThumbnailCache,
  getCacheInfo,
};