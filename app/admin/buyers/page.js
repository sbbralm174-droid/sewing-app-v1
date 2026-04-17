

import BuyerForm from '@/components/BuyerForm';
import BuyerList from '@/components/BuyerList';

export default function BuyersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a162e8] via-[#8a43d6] to-[#6b21a8] py-8 ">
      <div className="container mx-auto px-4 ">
       
        
        <div className="space-y-8">
          <BuyerForm />
          <BuyerList />
        </div>
      </div>
    </div>
  );
}


