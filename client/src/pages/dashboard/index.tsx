import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EvaluationCriteriaWidget from "@/components/widgets/EvaluationCriteriaWidget";
import UpcomingMeetingsWidget from "@/components/widgets/UpcomingMeetingsWidget";
import MentorManagement from "@/components/mentor/MentorManagement";
import OverallTasksWidget from "@/components/widgets/OverallTasksWidget";
import NumberOfStartupsWidget from "@/components/widgets/NumberOfStartupsWidget";
import ResourcesWidget from "@/components/widgets/ResourcesWidget";
import ProgramTimelineWidget from "@/components/widgets/ProgramTimelineWidget";
import DeliverablesWidget from "@/components/widgets/DeliverablesWidget";
import WinnerTeamWidget from "@/components/widgets/WinnerTeamWidget";
import { useProgramContext } from "@/context/ProgramContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Dashboard: React.FC = () => {
  const { selectedProgram, updateProgram } = useProgramContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  const handleStatusChange = (newStatus: "active" | "completed" | "draft") => {
    if (!selectedProgram) return;

    // Mettre à jour le programme sélectionné
    const updatedProgram = {
      ...selectedProgram,
      status: newStatus
    };

    // Utiliser la fonction updateProgram du contexte pour mettre à jour le programme
    updateProgram(updatedProgram);

    // Afficher une notification
    const statusText = newStatus === "active" ? "actif" : newStatus === "completed" ? "terminé" : "brouillon";
    toast({
      title: "Statut mis à jour",
      description: `Le programme est maintenant ${statusText}.`,
    });

    // Forcer un rafraîchissement de la page après un court délai
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
            {selectedProgram && (
              <div className="text-gray-500">
                Programme actuel: <span className="font-medium">{selectedProgram.name}</span>
                <Badge
                  className="ml-2"
                  variant={selectedProgram.status === "active" ? "secondary" : selectedProgram.status === "draft" ? "outline" : "default"}
                >
                  {selectedProgram.status === "active" ? "Actif" : selectedProgram.status === "draft" ? "Brouillon" : "Terminé"}
                </Badge>
              </div>
            )}
          </div>
          {!isMentor && (
            <Link href="/programs/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau programme
              </Button>
            </Link>
          )}
        </div>
      </div>

      {selectedProgram ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-5">
          {/* Program Information */}
          <Card className="mb-6 dashboard-card">
            <CardHeader>
              <CardTitle>{selectedProgram.name}</CardTitle>
              <CardDescription>{selectedProgram.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p>{new Date(selectedProgram.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p>{new Date(selectedProgram.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Statut</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant={selectedProgram.status === "active" ? "secondary" : selectedProgram.status === "draft" ? "outline" : "default"}
                    >
                      {selectedProgram.status === "active" ? "Actif" : selectedProgram.status === "draft" ? "Brouillon" : "Terminé"}
                    </Badge>
                    {!isMentor && (
                      <div className="flex space-x-1">
                        {selectedProgram.status !== "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange("active")}
                            className="text-xs h-7 px-2"
                          >
                            Activer
                          </Button>
                        )}
                        {selectedProgram.status !== "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange("completed")}
                            className="text-xs h-7 px-2"
                          >
                            Terminé
                          </Button>
                        )}
                        {selectedProgram.status !== "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange("draft")}
                            className="text-xs h-7 px-2"
                          >
                            Brouillon
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winner Team Widget */}
          <Card className="mb-6 dashboard-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateTo("/teams")}>
            <CardContent className="p-0">
              <WinnerTeamWidget />
            </CardContent>
          </Card>

          {/* Program Timeline */}
          <div className="mb-6">
            <Card className="dashboard-card">
              <CardContent className="p-4">
                <ProgramTimelineWidget />
              </CardContent>
            </Card>
          </div>

          {/* Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="overflow-hidden dashboard-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateTo("/teams")}>
              <CardContent className="p-0">
                <NumberOfStartupsWidget />
              </CardContent>
            </Card>
            <Card className="overflow-hidden dashboard-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateTo("/meetings")}>
              <CardContent className="p-0">
                <UpcomingMeetingsWidget />
              </CardContent>
            </Card>
            <Card className="overflow-hidden dashboard-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateTo("/tasks")}>
              <CardContent className="p-0">
                <OverallTasksWidget />
              </CardContent>
            </Card>
          </div>

          {/* Middle Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-6">
              <Card className="overflow-hidden dashboard-card">
                <CardContent className="p-0">
                  <EvaluationCriteriaWidget />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="overflow-hidden dashboard-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateTo("/resources")}>
                <CardContent className="p-0">
                  <ResourcesWidget />
                </CardContent>
              </Card>
              <Card className="overflow-hidden dashboard-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateTo("/deliverables")}>
                <CardContent className="p-0">
                  <DeliverablesWidget />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section - Mentor Management - Only visible for admins */}
          {!isMentor && (
            <div className="mt-6">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Réseau de mentors</CardTitle>
                  <CardDescription>Gérer les mentors du programme</CardDescription>
                </CardHeader>
                <CardContent>
                  <MentorManagement showAssignmentControls />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-5">
          <Card className="dashboard-card">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun programme sélectionné</h3>
                <p className="text-gray-500 mb-6">Veuillez sélectionner un programme pour afficher son tableau de bord</p>
                <Link href="/programs">
                  <Button>
                    Voir les programmes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
