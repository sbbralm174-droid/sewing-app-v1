import OccurrenceReportSearch from '@/components/OccurrenceReportSearch';

export default function SearchOccurrenceReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Search Occurrence Reports
        </h1>
        <OccurrenceReportSearch />
      </div>
    </div>
  );
}