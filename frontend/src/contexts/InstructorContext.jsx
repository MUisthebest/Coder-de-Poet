import React, { createContext, useContext, useState } from 'react';

const InstructorContext = createContext(null);

export const InstructorProvider = ({ children }) => {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);

  const value = {
    currentLesson,
    setCurrentLesson,
    currentCourse,
    setCurrentCourse,
  };

  return (
    <InstructorContext.Provider value={value}>
      {children}
    </InstructorContext.Provider>
  );
};

export const useInstructor = () => {
  const ctx = useContext(InstructorContext);
  if (!ctx) throw new Error('useInstructor must be used within InstructorProvider');
  return ctx;
};
