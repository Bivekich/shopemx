import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { BankDetailsForm } from '@/components/profile/BankDetailsForm';
import { SectionHeader } from '@/components/ui/section-header';
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
      birthDate: true,
      passportSeries: true,
      passportNumber: true,
      passportCode: true,
      passportIssueDate: true,
      passportIssuedBy: true,
      bankName: true,
      bankBik: true,
      bankAccount: true,
      bankCorAccount: true,
      useAlternativeDocument: true,
      alternativeDocument: true,
    },
  });

  const formattedProfile = profile
    ? {
        ...profile,
        passportIssueDate: profile.passportIssueDate
          ?.toISOString()
          .split('T')[0],
        birthDate: profile.birthDate?.toISOString().split('T')[0],
        middleName: profile.middleName || undefined,
        passportSeries: profile.passportSeries || undefined,
        passportNumber: profile.passportNumber || undefined,
        passportCode: profile.passportCode || undefined,
        passportIssuedBy: profile.passportIssuedBy || undefined,
        useAlternativeDocument: profile.useAlternativeDocument || false,
        alternativeDocument: profile.alternativeDocument || undefined,
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
          <SectionHeader
            title="Профиль пользователя"
            description="Основная информация о вас и ваших документах"
          />
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <ProfileForm initialData={formattedProfile} />
          </div>
        </div>

        <div>
          <SectionHeader
            title="Банковские реквизиты"
            description="Информация для получения денежных средств"
          />
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <BankDetailsForm initialData={bankDetails} />
          </div>
        </div>
      </div>
    </div>
  );
}
