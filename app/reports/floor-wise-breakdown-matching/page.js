// Example: app/historical-reports/page.js
import ViewReportByFloor from '@/components/breakdownHistoricalReports';
import SidebarNavLayout from '@/components/SidebarNavLayout';
export default function HistoricalReportsPage() {
  return (
    <div>
      <SidebarNavLayout/>
      <ViewReportByFloor />
    </div>


  );
}