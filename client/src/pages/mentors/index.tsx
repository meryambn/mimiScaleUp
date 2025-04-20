import React, { useState } from "react";
import MentorManagement from "@/components/mentor/MentorManagement";
import { Button } from "@/components/ui/button";
import { useProgramContext } from "@/context/ProgramContext";
import { Plus, User, Mail, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MentorsPage: React.FC = () => {
  const { selectedProgram, selectedProgramId } = useProgramContext();
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");

  const handleInviteByEmail = () => {
    // Logic to invite mentor by email
    console.log("Inviting mentor with email:", inviteEmail);
    setInviteEmail("");
    setOpen(false);
  };

  const handleInviteByUsername = () => {
    // Logic to invite mentor by username
    console.log("Inviting mentor with username:", inviteUsername);
    setInviteUsername("");
    setOpen(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Network</h1>
          <p className="text-muted-foreground">
            Manage mentors for <span className="font-medium">{selectedProgram.name}</span>
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Mentor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite Mentor</DialogTitle>
              <DialogDescription>
                Invite a mentor to join the program by email or username.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="email" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">By Email</TabsTrigger>
                <TabsTrigger value="username">By Username</TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="pt-4">
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        placeholder="mentor@example.com"
                        className="pl-8"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      {inviteEmail && (
                        <button
                          className="absolute right-2 top-2.5"
                          onClick={() => setInviteEmail("")}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={handleInviteByEmail} disabled={!inviteEmail}>Send Invitation</Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="username" className="pt-4">
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        placeholder="mentor_username"
                        className="pl-8"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                      />
                      {inviteUsername && (
                        <button
                          className="absolute right-2 top-2.5"
                          onClick={() => setInviteUsername("")}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={handleInviteByUsername} disabled={!inviteUsername}>Send Invitation</Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <MentorManagement 
        programId={selectedProgramId ? parseInt(selectedProgramId) : undefined}
        showAssignmentControls={true} 
      />
    </div>
  );
};

export default MentorsPage;