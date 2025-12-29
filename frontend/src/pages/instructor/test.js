const cloudinary = require('cloudinary').v2;

// 1. Cấu hình Cloudinary (Lấy từ Dashboard của bạn)
cloudinary.config({ 
  cloud_name: 'dwn2dmz66',
  api_key: 	'225619159369711', 
  api_secret: 'mkHFTCeTtSa3O1jTcuzyGrT6LoE'
});

const getVideoTranscript = async (publicId) => {
  try {
    // 2. Gọi API lấy thông tin chi tiết của video
    // 'resource_type: "video"' là bắt buộc vì mặc định nó tìm ảnh
    const result = await cloudinary.api.resource(publicId, { 
      resource_type: "video",
      image_metadata: true, // Đảm bảo lấy về toàn bộ metadata
      media_metadata: true 
    });

    // 3. Truy xuất vào đường dẫn chứa dữ liệu Google Speech
    // Lưu ý: Cấu trúc này có thể thay đổi tùy vào phiên bản API, 
    // nhưng thường nằm trong 'info' hoặc 'raw_convert'
    
    // Kiểm tra xem dữ liệu có tồn tại không
    if (result.info && 
        result.info.raw_convert && 
        result.info.raw_convert.google_speech) {
      
      const speechData = result.info.raw_convert.google_speech.data;
      
      console.log("--- TÌM THẤY TRANSCRIPT ---");
      console.log(speechData.transcript); // In ra toàn bộ văn bản gộp
      
      // Nếu bạn muốn lấy từng câu kèm thời gian (để làm tính năng click-to-seek):
      // console.log(speechData.parts); 

      return speechData.transcript;

    } else {
      console.log("Không tìm thấy dữ liệu transcription. Có thể video chưa xử lý xong hoặc chưa bật Add-on.");
      return null;
    }

  } catch (error) {
    console.error("Lỗi khi gọi Cloudinary:", error);
  }
};

// --- CHẠY THỬ ---
// Thay 'video_demo' bằng public_id video thực tế của bạn trên Cloudinary
getVideoTranscript('yif9d3rb4r9v2ifnut52');