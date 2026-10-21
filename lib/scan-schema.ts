import * as z from "zod";

const PartSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  partIds: z.array(z.string()),
});

// Successful scan: the only variant that carries results.
const OkScanSchema = z
  .object({
    status: z.literal("ok"),
    item: z.string(),
    parts: z.array(PartSchema),
    projects: z.array(ProjectSchema),
  })
  // Every partId a project uses must point to a part in this scan.
  .superRefine((scan, ctx) => {
    const partIds = new Set(scan.parts.map((part) => part.id));
    scan.projects.forEach((project, projectIndex) => {
      project.partIds.forEach((partId, partIdIndex) => {
        if (!partIds.has(partId)) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown part id "${partId}"`,
            path: ["projects", projectIndex, "partIds", partIdIndex],
          });
        }
      });
    });
  });

const BlurryScanSchema = z.object({ status: z.literal("blurry") });
const NotElectronicScanSchema = z.object({ status: z.literal("not_electronic") });
const ErrorScanSchema = z.object({ status: z.literal("error") });

export const ScanResponseSchema = z.discriminatedUnion("status", [
  OkScanSchema,
  BlurryScanSchema,
  NotElectronicScanSchema,
  ErrorScanSchema,
]);

export type ScanResponse = z.infer<typeof ScanResponseSchema>;
