

import BuyerForm from '@/components/BuyerForm';
import BuyerList from '@/components/BuyerList';

export default function BuyersPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Buyer Management System
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Add and manage your buyers efficiently
        </p>
        
        <div className="space-y-8">
          <BuyerForm />
          <BuyerList />
        </div>
      </div>
    </div>
  );
}


