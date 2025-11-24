import React from 'react';

const LearningSummary = () => {
  const stats = [
    { value: '12', label: 'Courses' },
    { value: '45h', label: 'Learned' },
    { value: '88%', label: 'Completion' },
    { value: '27', label: 'Certificates' }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Learning Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-blue-100 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningSummary;