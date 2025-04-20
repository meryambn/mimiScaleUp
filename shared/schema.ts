import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  profileImage: true,
});

// Program templates schema
export const programTemplates = pgTable("program_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  phases: jsonb("phases").notNull(),
  evaluationCriteria: jsonb("evaluation_criteria").notNull(),
  formTemplates: jsonb("form_templates").notNull(),
  dashboardLayout: jsonb("dashboard_layout"),
  popular: boolean("popular").default(false),
});

export const insertProgramTemplateSchema = createInsertSchema(programTemplates).pick({
  name: true,
  description: true,
  type: true,
  phases: true,
  evaluationCriteria: true,
  formTemplates: true,
  dashboardLayout: true,
  popular: true,
});

// Programs schema
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  templateId: integer("template_id").references(() => programTemplates.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  phases: jsonb("phases").notNull(),
  dashboardLayout: jsonb("dashboard_layout"),
  active: boolean("active").default(true),
});

export const insertProgramSchema = createInsertSchema(programs).pick({
  name: true,
  description: true,
  templateId: true,
  startDate: true,
  endDate: true,
  phases: true,
  dashboardLayout: true,
  active: true,
});

// Mentors schema
export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  expertise: text("expertise").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  userId: integer("user_id").references(() => users.id),
  title: text("title"),
  rating: integer("rating"),
  isTopMentor: boolean("is_top_mentor"),
  calendlyUrl: text("calendly_url"),
  linkedinUrl: text("linkedin_url"),
});

export const insertMentorSchema = createInsertSchema(mentors).pick({
  name: true,
  email: true,
  expertise: true,
  bio: true,
  profileImage: true,
  userId: true,
  title: true,
  rating: true,
  isTopMentor: true,
  calendlyUrl: true,
  linkedinUrl: true,
});

// Program mentors (junction table)
export const programMentors = pgTable("program_mentors", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  mentorId: integer("mentor_id").references(() => mentors.id).notNull(),
});

export const insertProgramMentorSchema = createInsertSchema(programMentors).pick({
  programId: true,
  mentorId: true,
});

// Startups schema
export const startups = pgTable("startups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  founderNames: text("founder_names").notNull(),
  industry: text("industry").notNull(),
  website: text("website"),
  logo: text("logo"),
  programId: integer("program_id").references(() => programs.id),
  userId: integer("user_id").references(() => users.id),
});

export const insertStartupSchema = createInsertSchema(startups).pick({
  name: true,
  description: true,
  founderNames: true,
  industry: true,
  website: true,
  logo: true,
  programId: true,
  userId: true,
});

// Application forms schema
export const applicationForms = pgTable("application_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  questions: jsonb("questions").notNull(),
  settings: jsonb("settings"),
});

export const insertApplicationFormSchema = createInsertSchema(applicationForms).pick({
  name: true,
  description: true,
  programId: true,
  questions: true,
  settings: true,
});

// Widgets schema
export const widgets = pgTable("widgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  icon: text("icon").notNull(),
  description: text("description"),
  config: jsonb("config"),
});

export const insertWidgetSchema = createInsertSchema(widgets).pick({
  name: true,
  type: true,
  icon: true,
  description: true,
  config: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProgramTemplate = typeof programTemplates.$inferSelect;
export type InsertProgramTemplate = z.infer<typeof insertProgramTemplateSchema>;

export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type Mentor = typeof mentors.$inferSelect;
export type InsertMentor = z.infer<typeof insertMentorSchema>;

export type ProgramMentor = typeof programMentors.$inferSelect;
export type InsertProgramMentor = z.infer<typeof insertProgramMentorSchema>;

export type Startup = typeof startups.$inferSelect;
export type InsertStartup = z.infer<typeof insertStartupSchema>;

export type ApplicationForm = typeof applicationForms.$inferSelect;
export type InsertApplicationForm = z.infer<typeof insertApplicationFormSchema>;

export type Widget = typeof widgets.$inferSelect;
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
