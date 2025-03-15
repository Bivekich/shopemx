import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { BankDetailsForm } from '@/components/profile/BankDetailsForm';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      firstName: true,
      lastName: true,
      middleName: true,
      email: true,
      phone: true,
      passportSeries: true,
      passportNumber: true,
      passportCode: true,
      passportIssueDate: true,
      passportIssuedBy: true,
      bankName: true,
      bankBik: true,
      bankAccount: true,
      bankCorAccount: true,
    },
  });

  const formattedProfile = profile
    ? {
        ...profile,
        passportIssueDate: profile.passportIssueDate
          ?.toISOString()
          .split('T')[0],
        middleName: profile.middleName || undefined,
        passportSeries: profile.passportSeries || undefined,
        passportNumber: profile.passportNumber || undefined,
        passportCode: profile.passportCode || undefined,
        passportIssuedBy: profile.passportIssuedBy || undefined,
      }
    : undefined;

  const bankDetails = profile
    ? {
        bankName: profile.bankName || undefined,
        bankBik: profile.bankBik || undefined,
        bankAccount: profile.bankAccount || undefined,
        bankCorAccount: profile.bankCorAccount || undefined,
      }
    : undefined;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-6">Профиль пользователя</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <ProfileForm initialData={formattedProfile} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">Банковские реквизиты</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <BankDetailsForm initialData={bankDetails} />
          </div>
        </div>
      </div>
    </div>
  );
}
