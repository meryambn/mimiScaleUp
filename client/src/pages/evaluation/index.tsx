import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Program } from "@shared/schema";
import { Plus, FileSpreadsheet, ArrowRight, Clipboard, CheckCircle2, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const EvaluationPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  // Fetch programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluation Framework</h1>
          <p className="text-muted-foreground">
            Manage evaluation criteria and conduct startup assessments
          </p>
        </div>

        {!isMentor && (
          <Button onClick={() => setLocation("/evaluation/create")}>
            <Plus className="mr-2 h-4 w-4" />
            New Evaluation Framework
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isMentor && (
          <Card>
            <CardHeader>
              <CardTitle>Create Evaluation Criteria</CardTitle>
              <CardDescription>
                Define how startups will be evaluated in your programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="text-sm">
                    Create custom evaluation criteria with different scoring methods like numerical scores, rating scales, yes/no questions, or text feedback.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clipboard className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="text-sm">
                    Set weights for each criterion to automatically calculate overall scores for ranking startups.
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/evaluation/create")}
              >
                Create Framework
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{isMentor ? "Évaluer les équipes" : "Conduct Evaluations"}</CardTitle>
            <CardDescription>
              {isMentor ? "Évaluez les équipes selon les critères définis" : "Assess startups based on your evaluation criteria"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Star className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-sm">
                  {isMentor ? "Attribuez des scores aux équipes selon différents critères et fournissez des commentaires détaillés." : "Easily evaluate startups using your custom frameworks. Track progress and view completion status."}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-sm">
                  {isMentor ? "Suivez la progression des équipes à travers les différentes phases du programme." : "Collect feedback from multiple evaluators and aggregate scores for comprehensive assessment."}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/teams")}
            >
              {isMentor ? "Voir les équipes" : "Start Evaluation"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-6">Program Evaluation Frameworks</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {programs.length > 0 ? (
          programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <CardTitle className="text-lg">{program.name}</CardTitle>
                <CardDescription>
                  {program.startDate && new Date(program.startDate).toLocaleDateString()} -
                  {program.endDate && new Date(program.endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {/* This would display the number of criteria if we had that data */}
                  No evaluation criteria defined yet
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/evaluation/program/${program.id}`)}
                >
                  Manage Framework
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-center">
                <h3 className="text-lg font-medium">No programs found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a program first to define evaluation criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/programs/create")}
                  className="mt-4"
                >
                  Create Program
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EvaluationPage;