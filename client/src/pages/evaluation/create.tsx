import React, { useState } from "react";
import EvaluationCriteriaBuilder, { EvaluationCriterion } from "@/components/evaluation/EvaluationCriteriaBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Program } from "@shared/schema";
import { ArrowLeft, Loader2 } from "lucide-react";

const CreateEvaluationCriteria: React.FC = () => {
  const [programId, setProgramId] = useState<number>(1); // Default to first program
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch program information
  const { data: program } = useQuery<Program>({
    queryKey: ['/api/programs', programId],
  });

  const createCriteriaMutation = useMutation({
    mutationFn: (criteriaData: EvaluationCriterion[]) =>
      apiRequest('/api/programs/' + programId + '/evaluation-criteria', JSON.stringify({ criteria: criteriaData })),
    onSuccess: () => {
      toast({
        title: "Evaluation criteria saved",
        description: "The evaluation criteria have been successfully saved.",
      });
      setLocation("/evaluation");
    },
    onError: (error) => {
      toast({
        title: "Error saving criteria",
        description: "Failed to save evaluation criteria. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = (criteria: EvaluationCriterion[]) => {
    createCriteriaMutation.mutate(criteria);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/evaluation")}
            className="mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Evaluation
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create Evaluation Criteria</h1>
          <p className="text-muted-foreground">
            Define how startups will be evaluated in your program
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {program?.name || "Program"} Evaluation Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EvaluationCriteriaBuilder
            programId={programId}
            onSave={handleSave}
          />
        </CardContent>
      </Card>

      {createCriteriaMutation.isPending && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Saving criteria...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEvaluationCriteria;