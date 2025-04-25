import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mentor, InsertMentor, insertMentorSchema } from "@/types/mentor";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Loader2, Plus, UserPlus } from "lucide-react";

type FormValues = InsertMentor;

interface MentorFormProps {
  onSubmit: (data: FormValues) => void;
  defaultValues?: Partial<FormValues>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

const MentorForm: React.FC<MentorFormProps> = ({
  onSubmit,
  defaultValues,
  isLoading = false,
  mode = "create"
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(insertMentorSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      expertise: [],
      bio: "",
      linkedinUrl: "",
      calendlyUrl: "",
      profileImage: "",
      isTopMentor: false,
      rating: 0,
      ...defaultValues,
    },
  });

  const handleSubmit = (data: FormValues) => {
    // No need to convert expertise since it's already an array
    onSubmit(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Add New Mentor" : "Edit Mentor"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CEO at Company"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Areas of Expertise</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Marketing, Finance, Product (comma separated)"
                      value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const expertiseArray = value
                          .split(",")
                          .map((skill: string) => skill.trim())
                          .filter((skill: string) => skill.length > 0);
                        field.onChange(expertiseArray);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>
                    Separate different areas with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mentor bio and background"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calendlyUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendly Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://calendly.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="profileImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/profile.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={field.value || 0}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isTopMentor"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Top Mentor</FormLabel>
                      <FormDescription>
                        Highlight this mentor as a top performer
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: 'none',
                width: '100%',
                opacity: isLoading ? '0.7' : '1'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Adding..." : "Updating..."}
                </>
              ) : (
                <>
                  {mode === "create" ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Mentor
                    </>
                  ) : (
                    "Update Mentor"
                  )}
                </>
              )}
            </button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export const MentorFormDialog: React.FC<{
  trigger?: React.ReactNode;
  onSubmit: (data: FormValues) => void;
  defaultValues?: Partial<FormValues>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({
  trigger,
  onSubmit,
  defaultValues,
  isLoading,
  mode = "create",
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Mentor" : "Edit Mentor"}
          </DialogTitle>
          <DialogDescription>
            Fill in the mentor details below.
          </DialogDescription>
        </DialogHeader>

        <MentorForm
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          isLoading={isLoading}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MentorForm;