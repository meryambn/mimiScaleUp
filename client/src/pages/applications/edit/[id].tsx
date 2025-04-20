import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ApplicationForm } from "@shared/schema";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProgramContext } from "@/context/ProgramContext";
import ApplicationFormTabs from "@/components/application/ApplicationFormTabs";

const EditApplicationForm: React.FC = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/applications/edit/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedProgramId } = useProgramContext();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);

  // Get form ID from URL
  const formId = match ? params.id : null;

  // Find form in cache
  useEffect(() => {
    if (!formId) return;

    // Try to get the form from the query cache first
    const cachedForms = queryClient.getQueryData<ApplicationForm[]>(['/api/application-forms']);
    const cachedForm = cachedForms?.find(form => String(form.id) === String(formId));

    if (cachedForm) {
      console.log("Found form in cache:", cachedForm);

      // Prepare the form data for editing
      setFormData({
        id: cachedForm.id,
        name: cachedForm.name,
        description: cachedForm.description,
        questions: cachedForm.questions || [],
        settings: cachedForm.settings || {
          title: cachedForm.name,
          description: cachedForm.description,
          submitButtonText: "Submit Application",
          showProgressBar: true,
          allowSaveDraft: true,
          confirmationMessage: "Thank you for your application!"
        },
        programId: cachedForm.programId
      });

      setIsLoading(false);
    } else {
      console.log("Form not found in cache, would fetch from API in real implementation");

      // In a real implementation, you would fetch from API
      // For now, we'll simulate a loading state and then set a not-found error
      setTimeout(() => {
        toast({
          title: "Form not found",
          description: "The application form you're trying to edit could not be found.",
          variant: "destructive",
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [formId, queryClient]);

  // Handle form save
  const updateFormMutation = useMutation({
    mutationFn: (updatedForm: any) => {
      // This would be a real API call in a production app
      console.log("Updating form:", updatedForm);

      // Simulate successful API call
      return new Promise((resolve) => {
        setTimeout(() => resolve(updatedForm), 1000);
      });
    },
    onSuccess: (updatedForm: any) => {
      // Update the cache manually
      queryClient.setQueryData<ApplicationForm[]>(['/api/application-forms'], (oldData = []) => {
        return oldData.map(form =>
          String(form.id) === String(updatedForm.id) ? {...form, ...updatedForm} : form
        );
      });

      // Also update the program-specific cache
      queryClient.setQueryData<ApplicationForm[]>(['/api/application-forms', updatedForm.programId],
        (oldData = []) => {
          return oldData.map(form =>
            String(form.id) === String(updatedForm.id) ? {...form, ...updatedForm} : form
          );
        }
      );

      toast({
        title: "Form updated",
        description: "Application form has been successfully updated.",
      });

      setLocation("/applications");
    },
    onError: () => {
      toast({
        title: "Error updating form",
        description: "Failed to update application form. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle saving form changes
  const handleSaveForm = (questions: any[], settings: any) => {
    if (!formData) return;

    const updatedForm = {
      ...formData,
      name: settings.title || formData.name,
      description: settings.description || formData.description,
      questions,
      settings
    };

    updateFormMutation.mutate(updatedForm);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Loading form data...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/applications")}
          className="mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Forms
        </Button>

        <div className="text-center p-10">
          <h3 className="text-lg font-medium">Form Not Found</h3>
          <p className="text-gray-500 mt-2">
            The application form you're trying to edit could not be found.
          </p>
          <Button onClick={() => setLocation("/applications")} className="mt-4">
            Return to Forms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/applications")}
            className="mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Forms
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Application Form</h1>
          <p className="text-muted-foreground">
            Update your application form
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <ApplicationFormTabs
          defaultQuestions={formData.questions}
          defaultSettings={formData.settings}
          onSave={handleSaveForm}
          programId={Number(formData.programId)}
        />
      </div>

      {updateFormMutation.isPending && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Saving form...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditApplicationForm;