import StyleForm from '@/components/StyleForm';
import StyleList from '@/components/StyleList';

export default function StylesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Style Management System
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Manage styles buyer-wise
        </p>
        
        <div className="space-y-8">
          <StyleForm />
          <StyleList />
        </div>
      </div>
    </div>
  );
}