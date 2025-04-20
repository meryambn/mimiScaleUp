import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mentor } from "@shared/schema";
import {
  UserPlus,
  Mail,
  Calendar,
  Link2,
  Star,
  ExternalLink,
  Trash2
} from "lucide-react";

interface MentorCardProps {
  mentor: Mentor;
  isAssigned?: boolean;
  onAssign?: (mentorId: number) => void;
  onRemove?: (mentorId: number) => void;
  // Removed onEdit
  onDelete?: (mentorId: number) => void;
  deleteButtonText?: string;
  onUnassign?: () => void;
  disabled?: boolean;
}

const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  isAssigned = false,
  onAssign,
  onRemove,
  // Removed onEdit,
  onDelete,
  deleteButtonText,
  onUnassign,
  disabled = false
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAction = () => {
    if (isAssigned && onRemove) {
      onRemove(mentor.id);
    } else if (onAssign) {
      onAssign(mentor.id);
    }
  };

  return (
    <Card className="overflow-hidden border hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mentor.profileImage || undefined} alt={mentor.name} />
              <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{mentor.name}</h3>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {mentor.rating !== null && mentor.rating > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {mentor.rating?.toFixed(1)}
              </Badge>
            )}
            {mentor.isTopMentor && (
              <Badge className="bg-amber-500 hover:bg-amber-600">Top Mentor</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <p className="text-sm">{mentor.bio}</p>

          <div className="space-y-1 pt-2">
            {mentor.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{mentor.email}</span>
              </div>
            )}
            {mentor.calendlyUrl && (
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <a
                  href={mentor.calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary flex items-center"
                >
                  Schedule a meeting
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            )}
            {mentor.linkedinUrl && (
              <div className="flex items-center text-sm">
                <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <a
                  href={mentor.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary flex items-center"
                >
                  LinkedIn Profile
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {(onDelete || onAssign || onRemove) && (
        <CardFooter className="flex justify-between pt-0">
          <div className="flex space-x-2">
            {/* Edit button removed */}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(mentor.id)}
                className="h-8 text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleteButtonText || (isAssigned ? "Retirer" : "Supprimer")}
              </Button>
            )}
          </div>

          {(onAssign || onRemove) && (
            <Button
              variant={isAssigned ? "secondary" : "default"}
              size="sm"
              onClick={handleAction}
              disabled={disabled}
              className="h-8"
            >
              {isAssigned ? (
                "Retirer"
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assigner
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default MentorCard;