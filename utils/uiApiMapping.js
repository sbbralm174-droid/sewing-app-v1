// utils/uiApiMapping.js




export const UI_API_MAPPING = {
  // Admin Dashboard
  '/admin': [
    { method: 'GET', path: '/api/admin/stats', description: 'Get admin statistics' },
    { method: 'GET', path: '/api/admin/dashboard', description: 'Admin dashboard data' }
  ],

  // Admin buyers
  '/admin/buyers': [
    { method: 'GET', path: '/api/buyers', description: 'Get admin statistics' },
    { method: 'DELETE', path: '/api/buyers/:id', description: 'delete buyers' },
    { method: 'POST', path: '/api/buyers', description: 'delete buyers' },
    { method: 'PUT', path: '/api/buyers/:id', description: 'delete buyers' },
  ],

  // Admin defects
  '/admin/defects': [
    { method: 'GET', path: '/api/defects', description: 'Get ALL DEFECTS' },
    { method: 'DELETE', path: '/api/defects/:id', description: 'delete defects' },
    { method: 'PUT', path: '/api/defects/:id', description: 'EDIT defects' },
    { method: 'POST', path: '/api/defects/:id', description: 'POST defects' },
    { method: 'POST', path: '/api/defects/search', description: 'search defects' },
],
  
  // Floor Management
  '/admin/floor': [
    { method: 'GET', path: '/api/floors', description: 'Get all floors' },
    { method: 'POST', path: '/api/floors', description: 'Create new floor' },
    { method: 'PUT', path: '/api/floors/:id', description: 'Update floor' },
    { method: 'DELETE', path: '/api/floors/:id', description: 'Delete floor' }
  ],
  
  // Floor Lines
  '/admin/floor-lines': [
    { method: 'GET', path: '/api/floor-lines', description: 'Get floor lines' },
    { method: 'POST', path: '/api/floor-lines', description: 'Create floor line' },
    { method: 'PUT', path: '/api/floor-lines/:id', description: 'Update floor line' }
  ],
  
  // Machine Types
  '/admin/machine-types': [
    { method: 'GET', path: '/api/machine-types', description: 'Get machine types' },
    { method: 'POST', path: '/api/machine-types', description: 'Create machine type' },
    { method: 'PUT', path: '/api/machine-types/:id', description: 'Update machine type' }
  ],
  
  // Machines
  '/admin/machines': [
    { method: 'GET', path: '/api/machines', description: 'Get all machines' },
    { method: 'POST', path: '/api/machines', description: 'Create machine' },
    { method: 'PUT', path: '/api/machines/:id', description: 'Update machine' },
    { method: 'GET', path: '/api/machines/types', description: 'Get machine types' }
  ],
  
  // Operators
  '/admin/operators': [
    { method: 'GET', path: '/api/operators', description: 'Get all operators' },
    { method: 'POST', path: '/api/operators', description: 'Create operator' },
    { method: 'GET', path: '/api/operators/search', description: 'Search operators' }
  ],
  
  // Operator Update
  '/admin/operators/update': [
    { method: 'PUT', path: '/api/operators/:id', description: 'Update operator' },
    { method: 'GET', path: '/api/operators/:id', description: 'Get operator details' }
  ],
  
  // Security (IEP Step 1)
  '/admin/iep-interview/1st-step': [
    { method: 'GET', path: '/api/iep/security', description: 'Get security interview data' },
    { method: 'POST', path: '/api/iep/security', description: 'Submit security interview' }
  ],
  
  // Down Admin (IEP Step 2)
  '/admin/iep-interview/2nd-step': [
    { method: 'GET', path: '/api/iep/down-admin', description: 'Get down admin data' },
    { method: 'POST', path: '/api/iep/down-admin', description: 'Submit down admin interview' }
  ],
  
  // IEP (Step 3)
  '/admin/iep-interview/3rd-step': [
    { method: 'GET', path: '/api/iep/assessment', description: 'Get IEP assessment' },
    { method: 'POST', path: '/api/iep/assessment', description: 'Submit IEP assessment' }
  ],
  
  // Update IEP Assessment
  '/admin/iep-interview/3rd-step/search-assessment': [
    { method: 'GET', path: '/api/iep/assessment/search', description: 'Search IEP assessment' },
    { method: 'PUT', path: '/api/iep/assessment/:id', description: 'Update IEP assessment' }
  ],
  
  // Admin Interview (Step 4)
  '/admin/iep-interview/4th-step': [
    { method: 'GET', path: '/api/iep/admin-interview', description: 'Get admin interview data' },
    { method: 'POST', path: '/api/iep/admin-interview', description: 'Submit admin interview' }
  ],
  
  // Interview Tracker
  '/admin/iep-interview/report-table': [
    { method: 'GET', path: '/api/iep/reports', description: 'Get interview reports' },
    { method: 'GET', path: '/api/iep/reports/export', description: 'Export reports' }
  ],
  
  // Supervisors
  '/admin/supervisors': [
    { method: 'GET', path: '/api/supervisors', description: 'Get all supervisors' },
    { method: 'POST', path: '/api/supervisors', description: 'Create supervisor' },
    { method: 'PUT', path: '/api/supervisors/:id', description: 'Update supervisor' }
  ],
  
  // Security Search
  '/admin/security-search': [
    { method: 'GET', path: '/api/security/search', description: 'Search security records' },
    { method: 'GET', path: '/api/security/logs', description: 'Get security logs' }
  ],
  
  // Resign
  '/admin/resign': [
    { method: 'POST', path: '/api/employees/resign', description: 'Submit resignation' },
    { method: 'GET', path: '/api/employees/resignations', description: 'Get resignation list' }
  ],
  
  // Operator Assessment
  '/operator-assessment': [
    { method: 'GET', path: '/api/assessments/operator', description: 'Get operator assessments' },
    { method: 'POST', path: '/api/assessments/operator', description: 'Submit operator assessment' }
  ],
  
  // Supervisor Dashboard
  '/supervisor': [
    { method: 'GET', path: '/api/supervisor/dashboard', description: 'Supervisor dashboard data' },
    { method: 'GET', path: '/api/supervisor/lines', description: 'Get supervisor lines' }
  ],
  
  // Add Process
  '/supervisor/processes': [
    { method: 'GET', path: '/api/processes', description: 'Get processes' },
    { method: 'POST', path: '/api/processes', description: 'Create process' }
  ],
  
  // Daily Production
  '/supervisor/daily-production-by-qrcode': [
    { method: 'GET', path: '/api/production/daily', description: 'Get daily production' },
    { method: 'POST', path: '/api/production/daily', description: 'Submit daily production' },
    { method: 'GET', path: '/api/qrcode/validate', description: 'Validate QR code' }
  ],
  
  // Hourly Production Entry
  '/admin/hourly-production-entry': [
    { method: 'GET', path: '/api/production/hourly', description: 'Get hourly production' },
    { method: 'POST', path: '/api/production/hourly', description: 'Submit hourly production' }
  ],
  
  // Line Completion
  '/supervisor/line-completion': [
    { method: 'GET', path: '/api/lines/completion', description: 'Get line completion' },
    { method: 'POST', path: '/api/lines/complete', description: 'Mark line complete' }
  ],
  
  // Delete Daily Production Entry
  '/supervisor/delete-daily-production-entry': [
    { method: 'DELETE', path: '/api/production/daily/:id', description: 'Delete production entry' },
    { method: 'GET', path: '/api/production/audit', description: 'Get production audit' }
  ],
  
  // Highest Process Score
  '/reports/heighest-process-score': [
    { method: 'GET', path: '/api/reports/highest-score', description: 'Get highest process scores' }
  ],
  
  // Top Process Scorer
  '/reports/top-process-scorer': [
    { method: 'GET', path: '/api/reports/top-scorers', description: 'Get top scorers' }
  ],
  
  // Occurrence Report
  '/admin/occurrence-report/search': [
    { method: 'GET', path: '/api/reports/occurrence', description: 'Get occurrence reports' },
    { method: 'POST', path: '/api/reports/occurrence/export', description: 'Export occurrence report' }
  ],
  
  // Line Wise Working Days
  '/reports/operator-work': [
    { method: 'GET', path: '/api/reports/working-days', description: 'Get working days report' }
  ],
  
  // Line Report
  '/reports/line-report': [
    { method: 'GET', path: '/api/reports/line', description: 'Get line report' }
  ],
  
  // Machine Report
  '/reports/machine-report': [
    { method: 'GET', path: '/api/reports/machine', description: 'Get machine report' }
  ],
  
  // Machine Last Location
  '/reports/machine-last-location-02': [
    { method: 'GET', path: '/api/machines/last-location', description: 'Get machine last location' }
  ],
  
  // Search By Process
  '/reports/search-by-process': [
    { method: 'GET', path: '/api/reports/by-process', description: 'Search by process' }
  ],
  
  // Supervisor Report
  '/reports/supervisor-report': [
    { method: 'GET', path: '/api/reports/supervisor', description: 'Get supervisor report' }
  ],
  
  // Breakdown Check
  '/reports/breackdown-check-1': [
    { method: 'GET', path: '/api/machines/breakdown', description: 'Get breakdown data' },
    { method: 'POST', path: '/api/machines/breakdown', description: 'Report breakdown' }
  ],
  
  // Operator Present Absent Report
  '/reports/operator-pressent-absent-report': [
    { method: 'GET', path: '/api/reports/attendance', description: 'Get attendance report' }
  ],
  
  // Floor Wise Breakdown Matching
  '/reports/floor-wise-breakdown-matching': [
    { method: 'GET', path: '/api/reports/breakdown-matching', description: 'Get breakdown matching report' }
  ],
  
  // Add common APIs that are used across multiple pages
  'COMMON': [
    { method: 'GET', path: '/api/auth/session', description: 'Get session info' },
    { method: 'GET', path: '/api/user/profile', description: 'Get user profile' }
  ]
};

// Helper function to get APIs for a page
export function getApisForPage(pagePath) {
  const pageApis = UI_API_MAPPING[pagePath] || [];
  const commonApis = UI_API_MAPPING['COMMON'] || [];
  
  return [...pageApis, ...commonApis];
}

// Helper to get all APIs for multiple pages
export function getApisForPages(pagePaths) {
  const allApis = new Set();
  
  pagePaths.forEach(path => {
    const apis = getApisForPage(path);
    apis.forEach(api => {
      const key = `${api.method}:${api.path}`;
      allApis.add(JSON.stringify(api));
    });
  });
  
  return Array.from(allApis).map(str => JSON.parse(str));
}