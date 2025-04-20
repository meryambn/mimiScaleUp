import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Star } from 'lucide-react';

interface EvaluationCriterion {
  id: number;
  name: string;
  weight: number;
  description: string;
  score?: number;
}

const DeliverableEvaluationPage = () => {
  const { id, deliverableId } = useParams();
  const [scores, setScores] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState('');

  const { data: deliverable, isLoading } = useQuery({
    queryKey: ['deliverable', id, deliverableId],
    queryFn: async () => {
      // Sample data - replace with actual API call
      const deliverables = {
        "1": {
          id: 1,
          name: 'Market Analysis Report',
          description: 'Comprehensive analysis of the renewable energy storage market',
          dueDate: '2024-03-15',
          submittedDate: '2024-03-14',
          status: 'evaluated',
          fileUrl: '#',
          score: 92,
          feedback: 'Excellent market analysis with comprehensive competitor research. Consider adding more details about international markets.',
          evaluationCriteria: [
            {
              id: 1,
              name: 'Market Research Depth',
              weight: 30,
              description: 'Depth and quality of market research and analysis',
              score: 5
            },
            {
              id: 2,
              name: 'Data Quality',
              weight: 40,
              description: 'Quality and reliability of data sources',
              score: 4
            },
            {
              id: 3,
              name: 'Competitive Analysis',
              weight: 30,
              description: 'Thoroughness of competitor analysis',
              score: 5
            }
          ]
        }
      };

      return deliverables[deliverableId as keyof typeof deliverables] || deliverables["1"];
    }
  });

  // Initialize scores and feedback when deliverable data is loaded
  React.useEffect(() => {
    if (deliverable && deliverable.evaluationCriteria) {
      const initialScores: Record<number, number> = {};
      deliverable.evaluationCriteria.forEach(criterion => {
        if (criterion.score) {
          initialScores[criterion.id] = criterion.score;
        }
      });
      setScores(initialScores);
      if (deliverable.feedback) {
        setFeedback(deliverable.feedback);
      }
    }
  }, [deliverable]);

  const evaluateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Replace with actual API call
      console.log('Submitting evaluation:', data);
    }
  });

  if (isLoading || !deliverable) {
    return <div>Loading...</div>;
  }

  const calculateOverallScore = () => {
    return deliverable.evaluationCriteria.reduce((total, criterion) => {
      const score = scores[criterion.id] || 0;
      return total + (score * criterion.weight) / 100;
    }, 0);
  };

  const handleSubmit = () => {
    evaluateMutation.mutate({
      deliverableId: deliverable.id,
      scores,
      feedback,
      overallScore: calculateOverallScore()
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{deliverable.name}</CardTitle>
              <p className="text-sm text-gray-500">{deliverable.description}</p>
            </div>
            {deliverable.fileUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={deliverable.fileUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Due: {deliverable.dueDate}</div>
              <div>Submitted: {deliverable.submittedDate}</div>
              {deliverable.status === 'evaluated' && (
                <div className="col-span-2">
                  <Badge className="bg-green-100 text-green-800">
                    Previously Evaluated
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {deliverable.evaluationCriteria.map((criterion) => (
                    <div key={criterion.id} className="space-y-2">
                      <div>
                        <h3 className="font-medium">{criterion.name}</h3>
                        <p className="text-sm text-gray-500">
                          Weight: {criterion.weight}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {criterion.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 cursor-pointer transition-colors ${
                              (scores[criterion.id] || 0) >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-200'
                            }`}
                            onClick={() => setScores({
                              ...scores,
                              [criterion.id]: star
                            })}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Overall Score</span>
                      <span className="text-2xl font-bold">
                        {calculateOverallScore().toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Provide detailed feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSubmit}>
                {deliverable.status === 'evaluated' ? 'Update Evaluation' : 'Submit Evaluation'}
              </Button>
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Document preview not available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverableEvaluationPage; 