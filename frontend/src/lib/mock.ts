import type { MedicalDocument } from '@/types'

/**
 * Seeded fallback data for features that require external service keys the developer may not
 * have configured yet (Supabase document storage/OCR, Ollama for AI chat). When the real API
 * call fails for those reasons, the UI shows this so every screen stays fully viewable.
 * A banner in the UI makes clear the data is a preview sample, not real records.
 */

export const MOCK_DOCUMENTS: MedicalDocument[] = [
  {
    _id: 'mock-1',
    type: 'lab_report',
    fileName: 'CBC_Blood_Report.pdf',
    fileType: 'application/pdf',
    description: 'Complete Blood Count — all values within normal range.',
    uploadedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
    status: 'approved',
    ocr: { text: 'Hemoglobin 14.2 g/dL · WBC 7,200 /µL · Platelets ２45,000 /µL · RBC 5.1 M/µL' },
    nlp: { summary: 'Routine CBC. Haemoglobin, WBC and platelet counts are all normal. No action needed.' },
  },
  {
    _id: 'mock-2',
    type: 'prescription',
    fileName: 'Prescription_Dr_Rao.jpg',
    fileType: 'image/jpeg',
    description: 'Prescription for hypertension management.',
    uploadedAt: new Date(Date.now() - 9 * 864e5).toISOString(),
    status: 'approved',
    ocr: { text: 'Amlodipine 5mg — once daily · Review after 4 weeks' },
    nlp: { summary: 'Anti-hypertensive (Amlodipine 5mg) prescribed once daily. Follow-up in 4 weeks.' },
  },
  {
    _id: 'mock-3',
    type: 'diagnostic_report',
    fileName: 'Lipid_Profile.pdf',
    fileType: 'application/pdf',
    description: 'Lipid panel — borderline cholesterol.',
    uploadedAt: new Date(Date.now() - 20 * 864e5).toISOString(),
    status: 'approved',
    ocr: { text: 'Total Cholesterol 214 mg/dL · LDL 138 mg/dL · HDL 44 mg/dL · Triglycerides 165 mg/dL' },
    nlp: { summary: 'Borderline-high total cholesterol and LDL. Lifestyle changes advised; recheck in 3 months.' },
  },
]

export function mockAiReply(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('cholesterol') || q.includes('lipid'))
    return 'Your most recent lipid panel showed a total cholesterol of 214 mg/dL with LDL at 138 mg/dL — both borderline-high. Your care team advised lifestyle changes and a recheck in about 3 months.'
  if (q.includes('bp') || q.includes('blood pressure') || q.includes('hypertension'))
    return 'You have an active prescription for Amlodipine 5mg once daily for blood-pressure management, with a follow-up scheduled. Keep logging your BP readings so trends stay visible to your doctor.'
  if (q.includes('blood') || q.includes('cbc') || q.includes('hemoglobin'))
    return 'Your latest CBC was normal — haemoglobin 14.2 g/dL, WBC 7,200/µL and platelets 245,000/µL are all within healthy ranges.'
  return "Based on your records, your recent reports are largely normal aside from borderline cholesterol. I can summarise a specific report or value — just ask, e.g. “What was my last cholesterol level?”"
}
