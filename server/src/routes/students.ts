import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { generateAiExplanation } from '../lib/ai.js';
import { calculateRisk, type AcademicProfile } from '../lib/risk.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const profileSchema = z.object({
  studentId: z.string().optional().or(z.literal('')),
  course: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  yearOfStudy: z.coerce.number().int().optional(),
  semester: z.string().optional().or(z.literal('')),
  previousSemesterGpa: z.coerce.number().optional(),
  currentSemesterAverage: z.coerce.number().optional(),
  catPerformance: z.coerce.number().optional(),
  attendanceRate: z.coerce.number().optional(),
  assignmentCompletion: z.coerce.number().optional(),
  studyHours: z.coerce.number().optional(),
  previousExamsFailures: z.coerce.number().int().optional(),
  financialRisk: z.coerce.number().int().optional(),
});

router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
  const assessment = await prisma.assessment.findFirst({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    profile,
    assessment,
  });
});

router.post('/profile', requireAuth, async (req: AuthRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Profile validation failed.', errors: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const existing = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });

  const profile = await prisma.studentProfile.upsert({
    where: { userId: req.user!.id },
    update: {
      studentId: payload.studentId ?? undefined,
      course: payload.course ?? undefined,
      department: payload.department ?? undefined,
      yearOfStudy: payload.yearOfStudy ?? undefined,
      semester: payload.semester ?? undefined,
      previousSemesterGpa: payload.previousSemesterGpa ?? undefined,
      currentSemesterAverage: payload.currentSemesterAverage ?? undefined,
      catPerformance: payload.catPerformance ?? undefined,
      attendanceRate: payload.attendanceRate ?? undefined,
      assignmentCompletion: payload.assignmentCompletion ?? undefined,
      studyHours: payload.studyHours ?? undefined,
      previousExamsFailures: payload.previousExamsFailures ?? undefined,
      financialRisk: payload.financialRisk ?? undefined,
    },
    create: {
      userId: req.user!.id,
      studentId: payload.studentId ?? null,
      course: payload.course ?? null,
      department: payload.department ?? null,
      yearOfStudy: payload.yearOfStudy ?? null,
      semester: payload.semester ?? null,
      previousSemesterGpa: payload.previousSemesterGpa ?? null,
      currentSemesterAverage: payload.currentSemesterAverage ?? null,
      catPerformance: payload.catPerformance ?? null,
      attendanceRate: payload.attendanceRate ?? null,
      assignmentCompletion: payload.assignmentCompletion ?? null,
      studyHours: payload.studyHours ?? null,
      previousExamsFailures: payload.previousExamsFailures ?? null,
      financialRisk: payload.financialRisk ?? null,
    },
  });

  return res.json({
    message: existing ? 'Student profile updated successfully.' : 'Student profile created successfully.',
    profile,
  });
});

router.post('/assess', requireAuth, async (req: AuthRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Assessment validation failed.', errors: parsed.error.flatten() });
  }

  const profileData: AcademicProfile = {
    ...parsed.data,
  };

  const existingProfile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
  const profile = existingProfile
    ? {
        ...existingProfile,
        ...profileData,
      }
    : profileData;

  if (!existingProfile) {
    await prisma.studentProfile.create({
      data: {
        userId: req.user!.id,
        studentId: profileData.studentId ?? null,
        course: profileData.course ?? null,
        department: profileData.department ?? null,
        yearOfStudy: profileData.yearOfStudy ?? null,
        semester: profileData.semester ?? null,
        previousSemesterGpa: profileData.previousSemesterGpa ?? null,
        currentSemesterAverage: profileData.currentSemesterAverage ?? null,
        catPerformance: profileData.catPerformance ?? null,
        attendanceRate: profileData.attendanceRate ?? null,
        assignmentCompletion: profileData.assignmentCompletion ?? null,
        studyHours: profileData.studyHours ?? null,
        previousExamsFailures: profileData.previousExamsFailures ?? null,
        financialRisk: profileData.financialRisk ?? null,
      },
    });
  }

  const assessment = calculateRisk(profile);
  const ai = await generateAiExplanation(profile, assessment);

  const savedAssessment = await prisma.assessment.create({
    data: {
      userId: req.user!.id,
      riskScore: assessment.score,
      riskLevel: assessment.level,
      summary: assessment.summary,
      recommendations: assessment.recommendations,
      aiExplanation: ai.explanation,
    },
  });

  return res.json({
    assessment: {
      id: savedAssessment.id,
      riskScore: savedAssessment.riskScore,
      riskLevel: savedAssessment.riskLevel,
      summary: savedAssessment.summary,
      recommendations: savedAssessment.recommendations,
      aiExplanation: savedAssessment.aiExplanation,
      createdAt: savedAssessment.createdAt,
    },
  });
});

export default router;
