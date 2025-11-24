import React from 'react';

const WeeklyActivity = ({ activities }) => {
  const totalHours = activities.reduce((sum, activity) => sum + activity.hours, 0);
  
  // Dữ liệu biểu đồ activity theo năm
  const yearlyChartData = [
    { month: 'Jan', value: 40 },
    { month: 'Jan', value: 60 },
    { month: 'Aug', value: 80 },
    { month: 'Sep', value: 70 },
    { month: 'Oct', value: 90 },
    { month: 'Nov', value: 50 }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
      
      {/* Activity Summary */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}h</div>
        <div className="text-green-600 text-sm font-medium">Great result!</div>
      </div>

      {/* Yearly Activity Chart */}
      <div className="mb-4">
        <div className="flex items-end justify-between h-24 border border-black px-2 rounded-lg">
          {yearlyChartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 border-l last:border-r border-black px-1">
              <div
                className="w-4 bg-blue-500 rounded-t transition-all duration-300"
                style={{ height: `${item.value}%`, minHeight: '8px' }}
              ></div>
              <span className="text-gray-500 text-xs mt-1">{item.month}</span>
            </div>
          ))}
        </div>
        <div className="text-right mt-2">
          <span className="text-gray-500 text-xs">Year</span>
        </div>
      </div>

    </div>
  );
};

export default WeeklyActivity;