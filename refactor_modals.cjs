const fs = require('fs');
const path = require('path');

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

  const onSubmitMatch = content.match(/const onSubmit =.*?\n.*?set(?:PendingData|Data).*?\n.*?setShow(?:SaveConfirm|SaveConfirmation|ConfirmDialog|Confirmation).*?\n\s*};/s);
  if (onSubmitMatch) {
    console.log('\n\n--- MATCH IN ' + file + ' ---');
    console.log(onSubmitMatch[0]);
  } else {
    // If not found, let's look for handleConfirmSave or similar inside onSubmit
    const generalSubmit = content.match(/const onSubmit =.*?=>\s*{[\s\S]*?}/);
    if (generalSubmit && (generalSubmit[0].includes('setShow') || generalSubmit[0].includes('Confirm'))) {
       console.log('\n\n--- GENERAL SUBMIT IN ' + file + ' ---');
       console.log(generalSubmit[0]);
    }
  }
}
