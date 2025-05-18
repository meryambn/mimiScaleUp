import React, { useState, useEffect } from "react";
import MentorManagement from "@/components/mentor/MentorManagement";
import { useProgramContext } from "@/context/ProgramContext";
import { Plus, UserPlus, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getAvailableMentors,
  addMentorToAdminPool,
  Mentor
} from "@/services/mentorService";

const MentorsPage: React.FC = () => {
  const { selectedProgram, selectedProgramId } = useProgramContext();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMentor, setIsAddingMentor] = useState(false);

  // Fetch available mentors when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableMentors();
    }
  }, [open]);

  // Filter mentors based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Ne pas afficher de mentors si aucune recherche n'est effectuée
      setFilteredMentors([]);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = availableMentors.filter(
        mentor =>
          mentor.nom.toLowerCase().includes(query) ||
          mentor.prenom.toLowerCase().includes(query) ||
          mentor.profession.toLowerCase().includes(query) ||
          (mentor.email && mentor.email.toLowerCase().includes(query))
      );
      setFilteredMentors(filtered);
    }
  }, [searchQuery, availableMentors]);

  // Fetch available mentors
  const fetchAvailableMentors = async () => {
    setIsLoading(true);
    try {
      const mentorsData = await getAvailableMentors();

      if (Array.isArray(mentorsData)) {
        setAvailableMentors(mentorsData);
        // Ne pas définir les mentors filtrés ici, seulement quand une recherche est effectuée
        // Réinitialiser la recherche à chaque ouverture du dialogue
        setSearchQuery("");
        setFilteredMentors([]);
      } else {
        setAvailableMentors([]);
        setFilteredMentors([]);
        toast({
          title: 'Avertissement',
          description: 'Format de données incorrect. Veuillez réessayer.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching available mentors:', error);
      setAvailableMentors([]);
      setFilteredMentors([]);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les mentors disponibles. Veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a mentor to the admin's pool
  const handleAddMentor = async (mentorId: number) => {
    setIsAddingMentor(true);
    try {
      console.log(`Attempting to add mentor ${mentorId} to admin pool...`);
      await addMentorToAdminPool(mentorId);

      console.log(`Successfully added mentor ${mentorId} to admin pool`);
      toast({
        title: 'Succès',
        description: 'Mentor ajouté au réseau avec succès.',
      });

      // Remove the added mentor from the list
      setAvailableMentors(prev => prev.filter(mentor => mentor.id !== mentorId));
      setFilteredMentors(prev => prev.filter(mentor => mentor.id !== mentorId));

      // Force refresh notifications
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error adding mentor to pool:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le mentor au réseau. Veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingMentor(false);
    }
  };

  if (!selectedProgram) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">No Program Selected</h1>
        <p className="text-gray-500 mb-6">Please select a program to view its mentors.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="admin-page-header flex justify-between items-center">
        <div>
          <h1>Réseau de mentors</h1>
          <p className="admin-subtitle">Gérez les mentors de votre réseau</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (newOpen) {
              fetchAvailableMentors();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', border: 'none' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Inviter un mentor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Inviter un mentor</DialogTitle>
              <DialogDescription>
                Recherchez et invitez un mentor à rejoindre votre réseau.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="search" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="search">Rechercher</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="pt-4">
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="search">Rechercher un mentor</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Rechercher par nom, prénom ou profession..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : searchQuery.trim() === '' ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Utilisez la barre de recherche ci-dessus pour trouver des mentors à inviter.</p>
                      </div>
                    ) : filteredMentors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Aucun mentor ne correspond à votre recherche.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Prénom</TableHead>
                            <TableHead>Profession</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMentors.map((mentor) => (
                            <TableRow key={mentor.id}>
                              <TableCell>{mentor.nom}</TableCell>
                              <TableCell>{mentor.prenom}</TableCell>
                              <TableCell>{mentor.profession}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddMentor(mentor.id)}
                                  disabled={isAddingMentor}
                                  style={{
                                    background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                                    color: 'white',
                                    border: 'none'
                                  }}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Ajouter
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <MentorManagement
        programId={selectedProgramId ? parseInt(selectedProgramId) : undefined}
      />
    </div>
  );
};

export default MentorsPage;