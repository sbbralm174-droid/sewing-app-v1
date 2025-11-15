// lib/interviewApi.js
export async function fetchAllCandidateData() {
  try {
    const [stepOneData, stepTwoData, adminData, iepInterviewData] = await Promise.all([
      fetch('http://localhost:3000/api/iep-interview/step-one-get').then(res => res.json()),
      fetch('http://localhost:3000/api/iep-interview/step-two/search').then(res => res.json()),
      fetch('http://localhost:3000/api/adminInterview').then(res => res.json()),
      fetch('http://localhost:3000/api/iep-interview/iep-interview-down-admin/get').then(res => res.json())
    ]);

    return {
      stepOneData,
      stepTwoData: Array.isArray(stepTwoData) ? stepTwoData : [],
      adminData: adminData?.data || [],
      iepInterviewData: Array.isArray(iepInterviewData) ? iepInterviewData : []
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      stepOneData: [],
      stepTwoData: [],
      adminData: [],
      iepInterviewData: []
    };
  }
}