// src/components/instructor/CoursesFilterBar.jsx
import React from "react";

const CoursesFilterBar = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  categories,
}) => {
  return (
    <div className="filters">
      <div className="filters-left">
        <input
          className="input"
          type="text"
          placeholder="Search course by title..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="">Status: All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="archived">Archived</option>
        </select>

        <select
          className="select"
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          <option value="">Category: All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-right">
        <select
          className="select"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
        >
          <option value="newest">Sort: Newest</option>
          <option value="students">Most Students</option>
          <option value="rating">Highest Rating</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
};

export default CoursesFilterBar;
