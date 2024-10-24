import { useCallback, useEffect, useState } from 'react';
import UserProfileCard from '../components/UserProfileCard'; // Import the UserProfileCard component
import {SearchBar} from '../components/index'
import authService from '../appwrite/auth';
import { Container } from '../components/index';

function Explore() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch all registered users
        const fetchedUsers = await authService.GetAllUsers() ;
        setUsers(fetchedUsers);
        console.log("Fetched users:", fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

   // Initialize filteredPosts when posts change
   useEffect(() => {
    setFilteredUsers(users);
  }, [users]);


    // Search functionality for users with memoized search handler
    const handleSearch = useCallback((searchTerm) => {
      if(!searchTerm.trim()) {
        setFilteredUsers(users);
        return;
      }
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    },[users])


  if (loading) {
    return (
      <Container>
         <SearchBar
          onSearch={handleSearch}
          placeholder="Search users by name or email..."
        />
        <p>Loading users...</p>
      </Container>
    );
  }

  if (users.length === 0) {
    return (
      <Container>
        <p>No users found.</p>
      </Container>
    );
  }

  return (
    <Container>
      <div className='mt-10 mb-4'>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search users by name or username..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <UserProfileCard key={user.$id} userDocId={user.$id} />
          ))}
          {filteredUsers.length === 0 && (
            <div className='col-span-full text-center'>
              <p className='text-xl text-gray-500'>No users found</p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
export default Explore;
