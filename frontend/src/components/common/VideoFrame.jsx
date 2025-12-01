// components/common/VideoFrame.js
import React from "react";
import ReactPlayer from "react-player"; // Chỉ import YouTube player

const VideoFrame = ({ url, className = "" }) => {
  // Kiểm tra nếu URL là YouTube URL
  const isYouTubeUrl = url && (url.includes('youtube.com') || url.includes('youtu.be'));
  
  if (!isYouTubeUrl) {
    return (
      <div className={`w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center ${className}`}>
        <p className="text-white">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls={true}
        playing={false}
        volume={0.8}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

export default VideoFrame;