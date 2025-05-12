import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { getAdminMentors } from "@/services/mentorService";
import { useToast } from "@/hooks/use-toast";

// Define the internal Mentor interface for this component
interface Mentor {
  id: number;
  name: string;
  expertise: string[];
  bio: string;
}

// Define the API Mentor interface from the backend
interface ApiMentor {
  id: number;
  nom: string;
  prenom: string;
  profession: string;
  email?: string;
}

interface MentorSelectionProps {
  selectedMentors: Mentor[];
  onMentorsChange: (mentors: Mentor[]) => void;
  availableMentors?: Mentor[];
}

const MentorSelection: React.FC<MentorSelectionProps> = ({
  selectedMentors = [],
  onMentorsChange,
  availableMentors: externalMentors
}) => {
  const { toast } = useToast();
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch mentors from the admin's pool
  useEffect(() => {
    const fetchMentors = async () => {
      setIsLoading(true);
      try {
        const mentorsData = await getAdminMentors();

        // Convert API mentors to the format expected by this component
        const formattedMentors: Mentor[] = mentorsData.map((mentor: ApiMentor) => ({
          id: mentor.id,
          name: `${mentor.prenom} ${mentor.nom}`,
          expertise: mentor.profession ? [mentor.profession] : [],
          bio: mentor.profession || ""
        }));

        setAvailableMentors(formattedMentors);
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
  }, [toast]);

  // Update availableMentors when externalMentors changes
  useEffect(() => {
    if (externalMentors && externalMentors.length > 0) {
      setAvailableMentors(externalMentors);
      console.log('Updated available mentors from external source:', externalMentors);
    }
  }, [externalMentors]);

  // Normalize selected mentors to ensure they have the correct format
  useEffect(() => {
    if (selectedMentors && selectedMentors.length > 0) {
      // Check if any mentor has expertise as a string instead of array
      const needsNormalization = selectedMentors.some(mentor =>
        typeof mentor.expertise === 'string' || !mentor.expertise
      );

      if (needsNormalization) {
        const normalizedMentors = selectedMentors.map(mentor => {
          let expertiseArray: string[] = ['General'];

          if (Array.isArray(mentor.expertise)) {
            expertiseArray = mentor.expertise;
          } else if (typeof mentor.expertise === 'string') {
            // Assertion de type explicite pour forcer TypeScript à traiter mentor.expertise comme une chaîne
            const expertiseString = mentor.expertise as string;
            expertiseArray = expertiseString.split(',').map((e: string) => e.trim());
          }

          return {
            ...mentor,
            expertise: expertiseArray
          };
        });

        onMentorsChange(normalizedMentors);
        console.log('Normalized selected mentors:', normalizedMentors);
      }
    }
  }, [selectedMentors, onMentorsChange]);

  const handleSelectMentor = (mentor: Mentor) => {
    if (!selectedMentors.find(m => m.id === mentor.id)) {
      onMentorsChange([...selectedMentors, mentor]);
    }
  };

  const handleRemoveMentor = (mentorId: number) => {
    onMentorsChange(selectedMentors.filter(m => m.id !== mentorId));
  };

  const filteredMentors = availableMentors;

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Mentors disponibles</h3>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun mentor disponible dans votre réseau.</p>
                <p className="mt-2">Ajoutez des mentors à votre réseau depuis la page "Réseau de mentors".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMentors.map((mentor) => (
                  <Card key={mentor.id} className="cursor-pointer hover:bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{mentor.name}</h4>
                            <p className="text-sm text-gray-500">{mentor.bio}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectMentor(mentor)}
                          disabled={selectedMentors.some(m => m.id === mentor.id)}
                          style={{
                            background: selectedMentors.some(m => m.id === mentor.id)
                              ? '#d1d5db'
                              : 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: selectedMentors.some(m => m.id === mentor.id) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          {selectedMentors.some(m => m.id === mentor.id) ? 'Ajouté' : 'Ajouter'}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

      <div className="space-y-4">
          <h3 className="text-lg font-medium">Mentors sélectionnés</h3>
          {selectedMentors.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
              <p className="text-gray-500">Aucun mentor sélectionné pour l'instant</p>
          </div>
        ) : (
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-4">
                {selectedMentors.map((mentor) => (
                  <Card key={mentor.id}>
                  <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-medium">{mentor.name}</h4>
                            <p className="text-sm text-gray-500">{mentor.bio}</p>

                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMentor(mentor.id)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Retirer
                        </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
            </ScrollArea>
        )}
        </div>
      </div>
    </div>
  );
};

export default MentorSelection;