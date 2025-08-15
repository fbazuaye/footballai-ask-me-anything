
import SearchInterface from "@/components/SearchInterface";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = () => {
  return (
    <ProtectedRoute>
      <SearchInterface />
    </ProtectedRoute>
  );
};

export default Index;
