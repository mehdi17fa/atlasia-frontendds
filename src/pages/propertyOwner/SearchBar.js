import { FaSearch, FaSlidersH } from 'react-icons/fa';

const SearchBar = () => {
  return (
    <div className="flex items-center border border-green-600 rounded-full px-4 py-2 w-full mt-4">
      <FaSearch className="text-gray-500 mr-2" />
      <input
        type="text"
        placeholder="Rechercher ..."
        className="flex-grow outline-none text-sm placeholder-gray-400"
      />
      <FaSlidersH className="text-gray-500 ml-2" />
    </div>
  );
};

export default SearchBar;