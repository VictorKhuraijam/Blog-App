import { useEffect, useState } from 'react';
import UserProfileCard from '../components/UserProfileCard'; // Import the UserProfileCard component
import authService from '../appwrite/auth';
import { Container } from '../components/index';

function Explore() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <Container>
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
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {users.map((user) => (
          <UserProfileCard key={user.$id} userDocId={user.$id} />
        ))}
      </div>
     </div>
    </Container>
  );
}

export default Explore;
