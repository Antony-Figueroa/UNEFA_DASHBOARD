import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/components/UserProfile/UserMetaCard.tsx',
  'src/components/UserProfile/UserPasswordCard.tsx',
  'src/features/careers/components/CareerModal.tsx',
  'src/features/enrollment/components/EnrollmentModal.tsx',
  'src/features/institutions/components/InstitutionalResponsibleModal.tsx',
  'src/features/institutions/components/InstitutionModal.tsx',
  'src/features/internship-types/components/InternshipTypeModal.tsx',
  'src/features/pre-enrollment/components/PreEnrollmentModal.tsx',
  'src/features/student-requests/components/NewRequestModal.tsx',
  'src/features/student-requests/components/RequestAttentionModal.tsx',
  'src/features/tutors/components/TutorModal.tsx',
  'src/features/users/components/UserModal.tsx',
  'src/features/visits/components/VisitModal.tsx',
  'src/pages/Config/sections/admin/components/PermissionMatrixModal.tsx',
  'src/pages/Culmination/Culmination.tsx'
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Let's replace the onSubmit to await the handleConfirmSave logic, but without pendingData state.
  // Actually, wait, replacing code structure via regex across 15 different files is risky. 
  // Let's print out the onSubmit and handleConfirmSave functions of each to see if they follow the exact same format.
  const onSubmitMatch = content.match(/const onSubmit =.*?\n.*?set(?:PendingData|Data).*?\n.*?setShow(?:SaveConfirm|SaveConfirmation|ConfirmDialog).*?\n\s*};/s);
  if (onSubmitMatch) {
    console.log(\n\n--- MATCH IN  ---);
    console.log(onSubmitMatch[0]);
  }
}
