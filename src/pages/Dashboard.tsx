import SearchInterface from "@/components/SearchInterface";
import ProtectedRoute from "@/components/ProtectedRoute";

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <SearchInterface />
    </ProtectedRoute>
  );
};

export default Dashboard;