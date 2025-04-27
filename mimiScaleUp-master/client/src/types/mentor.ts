import { z } from "zod";

export const mentorSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  expertise: z.array(z.string()),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  title: z.string().optional(),
  rating: z.number().optional(),
  isTopMentor: z.boolean().optional(),
  calendlyUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertMentorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  expertise: z.array(z.string()).min(1, "At least one area of expertise is required"),
  bio: z.string().min(20, "Bio should be at least 20 characters").optional(),
  profileImage: z.string().url("Invalid image URL").optional(),
  title: z.string().optional(),
  rating: z.number().optional(),
  isTopMentor: z.boolean().optional(),
  calendlyUrl: z.string().url("Invalid Calendly URL").optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
});

export type Mentor = z.infer<typeof mentorSchema>;
export type InsertMentor = z.infer<typeof insertMentorSchema>;

export interface ProgramMentor {
  id: number;
  programId: number;
  mentorId: number;
  createdAt: string;
  updatedAt: string;
} 