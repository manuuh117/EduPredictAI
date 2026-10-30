import express from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role === 'student') {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    const assessment = await prisma.assessment.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      role: 'student',
      profile,
      assessment,
      summary: {
        averageGpa: profile?.previousSemesterGpa ?? 0,
        attendance: profile?.attendanceRate ?? 0,
        riskScore: assessment?.riskScore ?? 0,
      },
    });
  }

  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: {
      profile: true,
      assessments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const mapped = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    course: student.profile?.course ?? 'Unassigned',
    department: student.profile?.department ?? 'Unassigned',
    riskScore: student.assessments[0]?.riskScore ?? 0,
    riskLevel: student.assessments[0]?.riskLevel ?? 'Low',
    attendance: student.profile?.attendanceRate ?? 0,
  }));

  const riskAverage = mapped.length
    ? mapped.reduce((total, student) => total + student.riskScore, 0) / mapped.length
    : 0;

  return res.json({
    role: req.user!.role,
    summary: {
      totalStudents: mapped.length,
      atRiskStudents: mapped.filter((student) => student.riskLevel !== 'Low').length,
      averageRiskScore: riskAverage,
    },
    students: mapped,
  });
});

export default router;
