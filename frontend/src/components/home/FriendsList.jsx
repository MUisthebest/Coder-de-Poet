import React from 'react';

const FriendsList = ({ friends }) => {
  // Tạo dữ liệu mẫu cho 274 friends (hiển thị 5-6 cái đầu)
  const displayFriends = friends.slice(0, 6);

  return (
    <div >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Friends</h3>
        <span className="text-blue-600 text-sm font-medium">{friends.length}+ friends</span>
      </div>

      <div className="space-y-3 max-h-70 overflow-y-auto custom-scrollbar">
        {displayFriends.map((friend) => (
          <div key={friend.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {friend.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            
            {/* Friend Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm">{friend.name}</div>
              <div className="text-gray-500 text-xs truncate">{friend.course}</div>
            </div>
            
            {/* Online Status */}
            <div className="flex flex-col items-end">
              <div className="w-2 h-2 bg-green-500 rounded-full mb-1"></div>
              <div className="text-gray-400 text-xs">Online</div>
            </div>
          </div>
        ))}
      </div>

      {/* Friends Summary */}
      <div className="mt-2 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">274</div>
            <div className="text-gray-500 text-xs">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">42</div>
            <div className="text-gray-500 text-xs">Online</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">18</div>
            <div className="text-gray-500 text-xs">Learning</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsList;