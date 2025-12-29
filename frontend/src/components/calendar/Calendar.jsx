import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreVertical, MapPin, Clock, X } from "lucide-react";
import dayjs from "dayjs";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState("week"); // "month", "week", "day"
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Booking taxi app",
      time: "08:00 - 07:30",
      date: "2023-12-17",
      color: "bg-blue-300",
      avatars: ["avatar1", "avatar2", "avatar3"],
      type: "Design",
    },
    {
      id: 2,
      title: "Design onboarding",
      time: "06:00 - 07:10",
      date: "2023-12-17",
      color: "bg-green-300",
      avatars: ["avatar1"],
      type: "Design",
    },
    {
      id: 3,
      title: "Book offsite",
      time: "07:00 - 10:00",
      date: "2023-12-17",
      color: "bg-gray-200",
      avatars: ["avatar1", "avatar2"],
      type: "Design",
    },
    {
      id: 4,
      title: "Development meet",
      time: "06:00 - 08:00",
      date: "2023-12-17",
      color: "bg-purple-300",
      avatars: ["avatar1"],
      type: "Development",
    },
    {
      id: 5,
      title: "Meet with Jonson Rider",
      time: "06:00 - 07:00",
      date: "2023-12-18",
      color: "bg-pink-200",
      location: "Park Lane Office",
      avatars: ["avatar1", "avatar2", "avatar3"],
      tags: ["Design", "Personal project", "Developer task"],
    },
  ]);

  const getDaysInWeek = (date) => {
    const startOfWeek = date.startOf("week");
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, "day"));
    }
    return days;
  };

  const weekDays = getDaysInWeek(currentDate);
  const today = dayjs();

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(currentDate.subtract(1, "week"));
    } else if (viewMode === "month") {
      setCurrentDate(currentDate.subtract(1, "month"));
    } else {
      setCurrentDate(currentDate.subtract(1, "day"));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(currentDate.add(1, "week"));
    } else if (viewMode === "month") {
      setCurrentDate(currentDate.add(1, "month"));
    } else {
      setCurrentDate(currentDate.add(1, "day"));
    }
  };

  const handleToday = () => {
    setCurrentDate(today);
  };

  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 6 + i;
    return `${String(hour).padStart(2, "0")}:00`;
  });

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {currentDate.format("MMMM, YYYY")}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          {["Month", "Week", "Day"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode.toLowerCase())}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === mode.toLowerCase()
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto bg-white">
        {viewMode === "week" && (
          <div className="w-full">
            {/* Week Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200">
              <div className="grid grid-cols-8 gap-2 p-4">
                <div className="text-gray-500"></div>
                {weekDays.map((day, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {day.format("ddd")}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        day.isSame(today, "day")
                          ? "bg-gray-800 text-white rounded-lg py-1"
                          : "text-gray-800"
                      }`}
                    >
                      {day.format("DD")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-8 gap-2 p-4">
              {/* Time Labels */}
              <div className="flex flex-col">
                {timeSlots.map((time, idx) => (
                  <div
                    key={idx}
                    className="h-24 flex items-start text-xs text-gray-500 font-medium"
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Days */}
              {weekDays.map((day, dayIdx) => (
                <div key={dayIdx} className="flex flex-col border-l border-gray-200">
                  {timeSlots.map((time, timeIdx) => (
                    <div
                      key={`${dayIdx}-${timeIdx}`}
                      className="h-24 border-b border-gray-100 relative"
                    >
                      {/* Render events for this time slot */}
                      {events
                        .filter((event) =>
                          dayjs(event.date).isSame(day, "day")
                        )
                        .map((event) => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`absolute left-1 right-1 top-1 p-2 rounded-lg text-xs text-black cursor-pointer hover:shadow-lg transition ${event.color}`}
                          >
                            <div className="font-semibold truncate">
                              {event.title}
                            </div>
                            <div className="text-xs opacity-75">
                              {event.time}
                            </div>
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "month" && (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700">
                  {day}
                </div>
              ))}
              {/* Month days would go here */}
            </div>
          </div>
        )}

        {viewMode === "day" && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">
              {currentDate.format("MMMM DD, YYYY")}
            </h2>
            {/* Day view would go here */}
          </div>
        )}
      </div>

      {/* Floating Add Event Button */}
      <button className="fixed bottom-6 right-6 bg-gray-800 text-white rounded-full p-4 hover:bg-gray-700 transition shadow-lg flex items-center gap-2">
        <Plus size={24} />
      </button>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedEvent.title}
            </h2>

            <div className="space-y-4 mb-6">
              {/* Date */}
              <div className="flex items-center gap-3 text-gray-700">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{dayjs(selectedEvent.date).format("dddd, DD MMMM")}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 text-gray-700">
                <Clock size={20} />
                <div>
                  <select className="bg-transparent text-sm">
                    <option>06:00</option>
                  </select>
                  <span className="mx-2">—</span>
                  <select className="bg-transparent text-sm">
                    <option>07:00</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin size={20} />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {selectedEvent.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedEvent.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Attendees */}
            <div className="flex items-center gap-2 mb-6">
              {selectedEvent.avatars && selectedEvent.avatars.length > 0 && (
                <>
                  {selectedEvent.avatars.map((avatar, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 bg-gray-400 rounded-full"
                    ></div>
                  ))}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition font-medium">
                Add Event
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
