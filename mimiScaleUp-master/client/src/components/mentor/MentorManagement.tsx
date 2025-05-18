import { useState, useCallback, useEffect } from "react";
import { useProgramContext } from "@/context/ProgramContext";
import { Mentor as SchemaType, ProgramMentor } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";
import MentorCard from "./MentorCard";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mentor } from "@/services/mentorService";
import { getAdminMentors } from "@/services/mentorService";
import { getProgramMentors, addMentorToProgram, removeMentorFromProgram } from "@/services/programMentorService";

interface MentorManagementProps {
  programId?: number;
  showAssignmentControls?: boolean;
}

const MentorManagement: React.FC<MentorManagementProps> = ({
  programId,
  showAssignmentControls = false
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const [adminMentors, setAdminMentors] = useState<Mentor[]>([]);
  const [programMentors, setProgramMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedProgram, setSelectedProgram } = useProgramContext();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  // Fetch admin mentors and program mentors on component mount
  useEffect(() => {
    const fetchMentors = async () => {
      setIsLoading(true);
      try {
        // Fetch mentors from the admin's pool
        const adminMentorsData = await getAdminMentors();
        setAdminMentors(adminMentorsData);

        // Fetch mentors assigned to the program if programId is provided
        if (programId) {
          const programMentorsData = await getProgramMentors(programId);
          setProgramMentors(programMentorsData);
        } else if (selectedProgram?.id) {
          // Use selectedProgram.id as fallback if programId is not provided
          const programMentorsData = await getProgramMentors(parseInt(selectedProgram.id));
          setProgramMentors(programMentorsData);
        } else {
          // If no program is selected, set empty array
          setProgramMentors([]);
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les mentors. Veuillez réessayer.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, [programId, selectedProgram?.id, toast]);

  // Unassign mentor from program
  const unassignMentor = useCallback(async (mentorId: number) => {
    // Use programId if provided, otherwise use selectedProgram.id
    const currentProgramId = programId || (selectedProgram?.id ? parseInt(selectedProgram.id) : null);

    if (!currentProgramId) {
      toast({
        title: 'Erreur',
        description: 'Aucun programme sélectionné. Veuillez sélectionner un programme.',
        variant: 'destructive'
      });
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir retirer ce mentor du programme ?")) {
      try {
        const success = await removeMentorFromProgram(currentProgramId, mentorId);

        if (success) {
          // Update the local programMentors state
          setProgramMentors(prev => prev.filter(mentor => mentor.id !== mentorId));

          toast({
            title: "Mentor retiré",
            description: "Le mentor a été retiré du programme avec succès.",
          });
        } else {
          toast({
            title: 'Erreur',
            description: 'Impossible de retirer le mentor du programme. Veuillez réessayer.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error removing mentor from program:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de retirer le mentor du programme. Veuillez réessayer.',
          variant: 'destructive'
        });
      }
    }
  }, [programId, selectedProgram?.id, toast]);

  // Assign mentor to program
  const assignMentor = useCallback(async (mentorId: number) => {
    // Use programId if provided, otherwise use selectedProgram.id
    const currentProgramId = programId || (selectedProgram?.id ? parseInt(selectedProgram.id) : null);

    if (!currentProgramId) {
      toast({
        title: 'Erreur',
        description: 'Aucun programme sélectionné. Veuillez sélectionner un programme.',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log(`Attempting to add mentor ${mentorId} to program ${currentProgramId}...`);
      await addMentorToProgram(currentProgramId, mentorId);

      console.log(`Successfully added mentor ${mentorId} to program ${currentProgramId}`);

      // Find the mentor in the admin mentors list
      const mentor = adminMentors.find(m => m.id === mentorId);
      if (mentor) {
        // Add the mentor to the program mentors list
        setProgramMentors(prev => [...prev, mentor]);
      }

      toast({
        title: "Mentor ajouté",
        description: "Le mentor a été ajouté au programme avec succès.",
      });

      // Force refresh notifications
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error adding mentor to program:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le mentor au programme. Veuillez réessayer.',
        variant: 'destructive'
      });
    }
  }, [programId, selectedProgram?.id, adminMentors, toast]);

  const isMentorAssigned = (mentorId: number) => {
    return programMentors.some(mentor => mentor.id === mentorId);
  };

  const getMentorsToDisplay = () => {
    // Si showAssignmentControls est true, on affiche toujours les mentors assignés
    if (showAssignmentControls || activeTab === "assigned") {
      // Show mentors assigned to the program
      return programMentors;
    } else if (activeTab === "all") {
      // Show all mentors from the admin's pool
      return adminMentors;
    }
    return [];
  };

  return (
    <div className="space-y-4">
      {/* N'afficher les onglets que si showAssignmentControls est false */}
      {!showAssignmentControls && (
        <div className="admin-tabs">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="admin-tabs-list">
              <TabsTrigger value="all" className={`admin-tab ${activeTab === "all" ? "active" : ""}`}>Réseau de mentors</TabsTrigger>
              <TabsTrigger value="assigned" className={`admin-tab ${activeTab === "assigned" ? "active" : ""}`}>Mentors assignés</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Texte descriptif selon l'onglet actif ou showAssignmentControls */}
      <div className="admin-subtitle">
        {showAssignmentControls ? (
          <p>
            Mentors assignés à {selectedProgram?.name || "Programme d'incubation local"}
          </p>
        ) : activeTab === "all" ? (
          <p>
            Gérer les mentors pour votre accélérateur
          </p>
        ) : (
          <p>
            Gérer les mentors pour {selectedProgram?.name || "Programme d'incubation local"}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : getMentorsToDisplay().length === 0 ? (
        <div className="admin-card text-center py-8">
          {showAssignmentControls ? (
            <p>Aucun mentor assigné à ce programme. Vous pouvez assigner des mentors depuis la page "Réseau de mentors".</p>
          ) : activeTab === "all" ? (
            <p>Aucun mentor dans votre réseau. Ajoutez des mentors en cliquant sur "Inviter un mentor".</p>
          ) : (
            <p>Aucun mentor assigné à ce programme. Assignez des mentors depuis l'onglet "Réseau de mentors".</p>
          )}
        </div>
      ) : (
        <div className="admin-mentors-list">
          {getMentorsToDisplay().map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={{
                id: mentor.id,
                name: `${mentor.prenom} ${mentor.nom}`,
                email: mentor.email || "",
                expertise: mentor.profession || "",
                bio: "",
                profileImage: null,
                rating: null,
                isTopMentor: false,
                calendlyUrl: null,
                linkedinUrl: null,
                title: mentor.profession || "",
                userId: null
              }}
              onDelete={isMentor ? undefined : (activeTab === "assigned" ? () => unassignMentor(mentor.id) : undefined)}
              deleteButtonText={activeTab === "assigned" ? "Retirer" : undefined}
              onAssign={activeTab === "all" && !isMentorAssigned(mentor.id) ? () => assignMentor(mentor.id) : undefined}
              onUnassign={undefined}
              isAssigned={isMentorAssigned(mentor.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorManagement;