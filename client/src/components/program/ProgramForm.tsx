import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ProgramFormProps {
  initialData: {
    name: string;
    description: string;
    startDate?: Date;
    endDate?: Date;
  };
  onSubmit: (data: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ initialData, onSubmit }) => {
  const form = useForm({
    defaultValues: {
      ...initialData,
      startDate: initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      endDate: initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    }
  });

  const handleSubmit = (data: any) => {
    onSubmit({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du programme</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Entrez le nom du programme" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Entrez la description du programme" />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de début</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de fin</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Enregistrer les détails</Button>
      </form>
    </Form>
  );
};

export default ProgramForm;
