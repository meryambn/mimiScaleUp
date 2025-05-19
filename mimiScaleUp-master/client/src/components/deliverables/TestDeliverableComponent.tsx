import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface TestDeliverableComponentProps {
  teamId: string;
}

const TestDeliverableComponent: React.FC<TestDeliverableComponentProps> = ({ teamId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        console.log('TestDeliverableComponent - Fetching submissions for team ID:', teamId);
        
        if (!teamId) {
          console.error('TestDeliverableComponent - Invalid teamId:', teamId);
          setError('Invalid team ID');
          setLoading(false);
          return;
        }

        const apiUrl = `${API_BASE_URL}/livrable-soumissions/equipe/${teamId}`;
        console.log('TestDeliverableComponent - API URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        console.log('TestDeliverableComponent - Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('TestDeliverableComponent - Error response:', errorText);
          setError(`Error: ${response.status} - ${errorText}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('TestDeliverableComponent - Response data:', data);
        
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          console.error('TestDeliverableComponent - Expected array but got:', typeof data);
          setSubmissions([]);
        }
      } catch (error) {
        console.error('TestDeliverableComponent - Error fetching submissions:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [teamId]);

  if (loading) {
    return <div className="p-4 bg-blue-50 rounded">Loading submissions...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 rounded text-red-700">Error: {error}</div>;
  }

  if (submissions.length === 0) {
    return <div className="p-4 bg-yellow-50 rounded">No submissions found for this team.</div>;
  }

  return (
    <div className="p-4 bg-green-50 rounded">
      <h3 className="font-bold mb-2">Found {submissions.length} submissions:</h3>
      <ul className="list-disc pl-5">
        {submissions.map((submission) => (
          <li key={submission.id} className="mb-2">
            <div><strong>ID:</strong> {submission.id}</div>
            <div><strong>File:</strong> {submission.nom_fichier}</div>
            <div><strong>Status:</strong> {submission.statut}</div>
            <div><strong>Submission Date:</strong> {new Date(submission.date_soumission).toLocaleString()}</div>
            {submission.nom_livrable && <div><strong>Deliverable:</strong> {submission.nom_livrable}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestDeliverableComponent;
