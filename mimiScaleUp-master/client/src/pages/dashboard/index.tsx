import React from "react";
import { Link, useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { updateProgramStatus, getProgram } from "@/services/programService";
import { getStatusDisplayText } from "@/utils/statusMapping";
import { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
  const { selectedProgram, updateProgram } = useProgramContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const [isTemplate, setIsTemplate] = useState(false);

  // Fetch program details to check if it's a template
  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (selectedProgram?.id) {
        try {
          const programDetails = await getProgram(selectedProgram.id);
          if (programDetails && programDetails.is_template === 'Modèle') {
            setIsTemplate(true);
          } else {
            setIsTemplate(false);
          }
        } catch (error) {
          console.error("Error fetching program details:", error);
        }
      }
    };

    fetchProgramDetails();
  }, [selectedProgram?.id]);

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  const handleStatusChange = async (newStatus: "active" | "completed" | "draft") => {
    if (!selectedProgram) {
      console.error("No program selected");
      return;
    }

    console.log(`Changing program ${selectedProgram.id} status from ${selectedProgram.status} to ${newStatus}`);

    // Check status transition rules
    if (selectedProgram.status === "completed" && newStatus !== "completed") {
      console.error("Cannot change status from completed to any other status");
      toast({
        title: "Action non autorisée",
        description: "Impossible de changer le statut d'un programme terminé.",
        variant: "destructive"
      });
      return;
    }

    if (selectedProgram.status === "active" && newStatus === "draft") {
      console.error("Cannot change status from active to draft");
      toast({
        title: "Action non autorisée",
        description: "Impossible de changer un programme actif en brouillon.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`Calling updateProgramStatus with programId=${selectedProgram.id}, status=${newStatus}`);

      // Call the backend API to update the program status
      const result = await updateProgramStatus(selectedProgram.id, newStatus);
      console.log("Status update result:", result);

      // Update the program in the local context
      const updatedProgram = {
        ...selectedProgram,
        status: newStatus
      };
      updateProgram(updatedProgram);

      // Display a notification
      const statusText = getStatusDisplayText(newStatus);
      toast({
        title: "Statut mis à jour",
        description: `Le programme est maintenant ${statusText}.`,
      });

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error updating program status:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive"
      });
    }
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
                <div className="flex items-center space-x-2">
                  <div className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${selectedProgram.status === "draft"
                      ? "bg-gray-100 text-gray-800 border border-gray-300"
                      : selectedProgram.status === "active"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-blue-100 text-blue-800 border border-blue-300"}
                  `}>
                    {selectedProgram.status === "active" ? "Actif" : selectedProgram.status === "draft" ? "Brouillon" : "Terminé"}
                  </div>
                  {isTemplate && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                      Modèle
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {!isMentor && (
            <Link href="/programs/create">
              <button
                style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau programme
              </button>
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
                    <div className="flex items-center space-x-2">
                      <div className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${selectedProgram.status === "draft"
                          ? "bg-gray-100 text-gray-800 border border-gray-300"
                          : selectedProgram.status === "active"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"}
                      `}>
                        {selectedProgram.status === "active" ? "Actif" : selectedProgram.status === "draft" ? "Brouillon" : "Terminé"}
                      </div>
                      {isTemplate && (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                          Modèle
                        </div>
                      )}
                    </div>
                    {!isMentor && (
                      <div className="flex space-x-1">
                        {selectedProgram.status !== "active" && (
                          <button
                            onClick={() => handleStatusChange("active")}
                            style={{ backgroundColor: '#0c4c80', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', height: '28px' }}
                          >
                            Activer
                          </button>
                        )}
                        {selectedProgram.status !== "completed" && (
                          <button
                            onClick={() => handleStatusChange("completed")}
                            style={{ backgroundColor: '#0c4c80', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', height: '28px' }}
                          >
                            Terminé
                          </button>
                        )}
                        {selectedProgram.status !== "draft" && (
                          <button
                            onClick={() => handleStatusChange("draft")}
                            style={{ backgroundColor: '#0c4c80', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', height: '28px' }}
                          >
                            Brouillon
                          </button>
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
                  <MentorManagement
                    showAssignmentControls
                    programId={selectedProgram?.id ? parseInt(selectedProgram.id) : undefined}
                  />
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
                  <button
                    style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                  >
                    Voir les programmes
                  </button>
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
