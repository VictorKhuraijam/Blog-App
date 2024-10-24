import { useState, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';

function SearchBar ({
  onSearch,
  placeholder = "Search...",
  debounceTime = 300
}) {
  const [searchTerm, setSearchTerm] = useState('');



  // Debounced search handler
  const debouncedSearch = useCallback(() => {
    let timeOutId;
    return (value) => {
      clearTimeout(timeOutId);
      timeOutId = setTimeout(() => {
        onSearch(value);
      }, debounceTime);
    }
  },[onSearch, debounceTime])

  const debouncedSearchHandler = useMemo(
    () => debouncedSearch(),
    [debouncedSearch]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearchHandler(value)
  }

  return (
    <div className="relative max-w-xl mx-auto mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
    </div>
  );
};

export default SearchBar;
