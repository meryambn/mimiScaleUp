import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { checkProgramAccess } from '@/services/programAccessService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ProgramAccessGuardProps {
  programId: string | number;
  children: React.ReactNode;
  redirectPath?: string;
}

/**
 * A component that guards access to program pages based on program status
 * Redirects users if they don't have access to the program (e.g., if it's terminated)
 */
const ProgramAccessGuard: React.FC<ProgramAccessGuardProps> = ({
  programId,
  children,
  redirectPath = '/startup/dashboard'
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!programId) {
        setIsChecking(false);
        return;
      }

      try {
        // Pass the user ID to checkProgramAccess
        const userId = user?.id;
        const { hasAccess, message } = await checkProgramAccess(programId, userId);

        setHasAccess(hasAccess);

        if (!hasAccess && message) {
          // Show toast notification
          toast({
            title: "Accès refusé",
            description: message,
            variant: "destructive",
          });

          // Redirect to the specified path
          setLocation(redirectPath);
        }
      } catch (error) {
        console.error('Error checking program access:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [programId, redirectPath, setLocation, toast, user]);

  // While checking access, return null or a loading indicator
  if (isChecking) {
    return null; // Or return a loading spinner
  }

  // If access is granted, render children
  return hasAccess ? <>{children}</> : null;
};

export default ProgramAccessGuard;
