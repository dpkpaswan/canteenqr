import React from 'react';
import Icon from '../../../components/AppIcon';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <div className="bg-card border-b border-border sticky top-0 z-[90] shadow-sm">
      <div className="px-4 py-3">
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
          <button
            onClick={() => onCategoryChange('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            All Items
          </button>
          {categories?.filter(cat => cat !== 'all').map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;