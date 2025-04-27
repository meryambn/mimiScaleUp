import { useState, useCallback, useEffect } from "react";
import { useProgramContext } from "@/context/ProgramContext";
import { Mentor, ProgramMentor } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";
import MentorCard from "./MentorCard";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Mock data store
const mockMentors: Mentor[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    expertise: "Technology, Teams",
    bio: "Serial entrepreneur with 10+ years of experience",
    profileImage: null,
    rating: 4.8,
    isTopMentor: true,
    calendlyUrl: null,
    linkedinUrl: null,
    title: "CEO, TechVentures",
    userId: null
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    expertise: "Healthcare, Innovation",
    bio: "Healthcare industry expert and startup advisor",
    profileImage: null,
    rating: 4.9,
    isTopMentor: true,
    calendlyUrl: null,
    linkedinUrl: null,
    title: "Founder, HealthTech Innovations",
    userId: null
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    expertise: "Social Impact, Technology",
    bio: "Social entrepreneur and startup mentor",
    profileImage: null,
    rating: 4.7,
    isTopMentor: false,
    calendlyUrl: null,
    linkedinUrl: null,
    title: "Director, Impact Ventures",
    userId: null
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    expertise: "Fintech, Marketing",
    bio: "Fintech marketing specialist and growth advisor",
    profileImage: null,
    rating: 4.6,
    isTopMentor: false,
    calendlyUrl: null,
    linkedinUrl: null,
    title: "CMO, FinGrowth",
    userId: null
  }
];

interface MentorManagementProps {
  programId?: number;
}

const MentorManagement: React.FC<MentorManagementProps> = ({
  programId
}) => {
  const [activeTab, setActiveTab] = useState("all");

  // Removed mentor form state
  const [mentors, setMentors] = useState<Mentor[]>(mockMentors);
  const [programMentors, setProgramMentors] = useState<ProgramMentor[]>([]);
  const { selectedProgram, setSelectedProgram } = useProgramContext();
  // Removed isLoading state
  const { toast } = useToast();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  // Removed createMentor function

  // Removed updateMentor function

  // Delete mentor
  const deleteMentor = useCallback((mentorId: number) => {
    if (window.confirm("Are you sure you want to delete this mentor? This action cannot be undone.")) {
      setMentors(prev => prev.filter(mentor => mentor.id !== mentorId));
      toast({
        title: "Mentor deleted",
        description: "Mentor has been successfully removed from the system.",
      });
    }
  }, [toast]);

  // Removed assignMentor function

  // Unassign mentor from program
  const unassignMentor = useCallback((mentorId: number) => {
    if (!selectedProgram) return;

    if (window.confirm("Are you sure you want to remove this mentor from the program?")) {
      // Update the local programMentors state
      setProgramMentors(prev => prev.filter(pm => pm.mentorId !== mentorId));

      // Update the selected program's mentors in the context
      if (selectedProgram && selectedProgram.mentors && Array.isArray(selectedProgram.mentors)) {
        const updatedMentors = selectedProgram.mentors.filter((mentor: any) =>
          mentor.id !== mentorId && Number(mentor.id) !== mentorId
        );

        // Create an updated program object
        const updatedProgram = {
          ...selectedProgram,
          mentors: updatedMentors
        };

        // Update the program in the context
        setSelectedProgram(updatedProgram);
        console.log('Updated program mentors:', updatedMentors);

        // Also update localStorage if needed
        try {
          const programKey = `program_${selectedProgram.id}`;
          localStorage.setItem(programKey, JSON.stringify(updatedProgram));
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      }

      toast({
        title: "Mentor unassigned",
        description: "Mentor has been successfully removed from the program.",
      });
    }
  }, [selectedProgram, setSelectedProgram, toast]);

  const filterMentors = (mentorList: Mentor[]) => {
    return mentorList;
  };

  // Removed getAssignableMentors function

  const isMentorAssigned = (mentorId: number) => {
    return programMentors.some(pm => pm.mentorId === mentorId);
  };

  // Update programMentors when selectedProgram changes
  useEffect(() => {
    if (selectedProgram && selectedProgram.mentors && Array.isArray(selectedProgram.mentors)) {
      console.log('Selected program mentors:', selectedProgram.mentors);
      // Convert the mentors from the selected program to ProgramMentor format
      const newProgramMentors = selectedProgram.mentors.map((mentor: any, index: number) => ({
        id: index + 1,
        programId: Number(selectedProgram.id),
        mentorId: typeof mentor.id === 'number' ? mentor.id : Number(mentor.id)
      }));
      setProgramMentors(newProgramMentors);

      // Also add any mentors that might not be in the mentors list
      const mentorIds = mentors.map(m => m.id);
      const newMentors = [...mentors];

      selectedProgram.mentors.forEach((mentor: any) => {
        const mentorId = typeof mentor.id === 'number' ? mentor.id : Number(mentor.id);
        if (!mentorIds.includes(mentorId) && mentor.name) {
          // Add this mentor to the mentors list
          newMentors.push({
            id: mentorId,
            name: mentor.name,
            email: mentor.email || `mentor${mentorId}@example.com`,
            expertise: mentor.expertise || '',
            bio: mentor.bio || 'Program mentor',
            profileImage: mentor.profileImage || null,
            rating: mentor.rating || null,
            isTopMentor: mentor.isTopMentor || null,
            calendlyUrl: mentor.calendlyUrl || null,
            linkedinUrl: mentor.linkedinUrl || null,
            title: mentor.title || null,
            userId: mentor.userId || null
          });
        }
      });

      if (newMentors.length > mentors.length) {
        setMentors(newMentors);
      }
    }
  }, [selectedProgram, mentors]);

  const getMentorsToDisplay = () => {
    if (activeTab === "all") {
      return filterMentors(mentors);
    } else if (activeTab === "assigned") {
      // Get mentors assigned to the selected program
      const assignedMentorIds = programMentors.map(pm => pm.mentorId);
      return filterMentors(mentors.filter(mentor => assignedMentorIds.includes(mentor.id)));
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tous les mentors</TabsTrigger>
            <TabsTrigger value="assigned">Assignés</TabsTrigger>
          </TabsList>
        </Tabs>
        {/* Removed "Add a mentor" button */}
      </div>

      {/* Removed MentorFormDialog */}



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getMentorsToDisplay().map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            /* Removed onEdit */
            onDelete={isMentor ? undefined : (activeTab === "assigned" ? () => unassignMentor(mentor.id) : activeTab === "all" ? () => deleteMentor(mentor.id) : undefined)}
            deleteButtonText={activeTab === "assigned" ? "Retirer" : "Supprimer"}
            onAssign={undefined}
            onUnassign={undefined}
            isAssigned={isMentorAssigned(mentor.id)}
          />
        ))}
      </div>

      {/* Removed MentorFormDialog for editing */}
    </div>
  );
};

export default MentorManagement;