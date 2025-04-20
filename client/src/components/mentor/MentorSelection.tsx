import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface Mentor {
  id: number;
  name: string;
  expertise: string[];
  bio: string;
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

  const [availableMentors, setAvailableMentors] = useState<Mentor[]>(externalMentors || [
    {
      id: 1,
      name: "John Doe",
      expertise: ["Technology", "Teams"],
      bio: "Serial entrepreneur with 10+ years of experience"
    },
    {
      id: 2,
      name: "Jane Smith",
      expertise: ["Healthcare", "Innovation"],
      bio: "Healthcare industry expert and startup advisor"
    },
    {
      id: 3,
      name: "Mike Johnson",
      expertise: ["Social Impact", "Technology"],
      bio: "Social entrepreneur and startup mentor"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      expertise: ["Fintech", "Marketing"],
      bio: "Fintech marketing specialist and growth advisor"
    }
  ]);

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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectMentor(mentor)}
                        disabled={selectedMentors.some(m => m.id === mentor.id)}
                      >
                        {selectedMentors.some(m => m.id === mentor.id) ? 'Ajouté' : 'Ajouter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMentor(mentor.id)}
                        >
                          Retirer
                        </Button>
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