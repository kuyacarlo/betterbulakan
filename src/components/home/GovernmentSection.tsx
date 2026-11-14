import { FC, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '@bettergov/kapwa/button';
import { Building2Icon, HomeIcon, UsersIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardGrid } from '@/components/ui/Card';

import barangaysData from '@/data/directory/barangays.json';
import departmentsData from '@/data/directory/departments.json';

const GovernmentSection: FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const barangayCount = useMemo(
    () => (Array.isArray(barangaysData) ? barangaysData.length : 0),
    []
  );
  const departmentCount = useMemo(
    () => (Array.isArray(departmentsData) ? departmentsData.length : 0),
    []
  );

  const branches = [
    {
      id: 'executive',
      title: t('government.electedofficialsTitle'),
      description: t(
        'government.electedofficialsDescription',
        'Meet your Mayor, Vice Mayor, and Councilors.'
      ),
      icon: <UsersIcon className='text-kapwa-text-brand h-10 w-10' />,
      link: '/government/elected-officials',
    },
    {
      id: 'legislative',
      title: t('government.departmentsTitle'),
      description: t(
        'government.departmentsDescription',
        'Services and offices under the Executive branch.'
      ),
      icon: <Building2Icon className='text-kapwa-text-brand h-10 w-10' />,
      link: '/government/departments',
    },
    {
      id: 'barangays',
      title: t('government.barangaysTitle'),
      description: t('government.barangaysDescription'),
      icon: <HomeIcon className='text-kapwa-text-brand h-10 w-10' />,
      link: '/government/barangays',
    },
  ];

  return (
    <section className='bg-kapwa-bg-surface py-12'>
      <div className='container mx-auto px-4'>
        <div className='mb-12 text-center'>
          <h2 className='text-kapwa-text-strong mb-4 kapwa-heading-lg font-bold'>
            {t('government.title')}
          </h2>
          <p className='text-kapwa-text-support mx-auto max-w-2xl'>
            {t('government.description')}
          </p>
        </div>

        {/* Quick stats using documented Badge component */}
        <div className='flex flex-wrap justify-center gap-4 mb-8'>
          <Badge variant='primary' className='px-4 py-2 text-sm'>
            {barangayCount} Barangays
          </Badge>
          <Badge variant='secondary' className='px-4 py-2 text-sm'>
            {departmentCount} Departments
          </Badge>
          <Badge variant='slate' className='px-4 py-2 text-sm'>
            Elected Officials
          </Badge>
        </div>

        {/* Using documented CardGrid pattern */}
        <CardGrid columns={3}>
          {branches.map(branch => (
            <Card key={branch.id} hover className='text-center'>
              <CardContent className='p-6'>
                <div className='mb-4 flex justify-center'>{branch.icon}</div>
                <h3 className='text-kapwa-text-strong mb-2 text-xl font-semibold'>
                  {branch.title}
                </h3>
                <p className='text-kapwa-text-support mb-4'>
                  {branch.description}
                </p>
                <Button
                  onClick={() => navigate(branch.link)}
                  variant='link'
                  size='sm'
                  rightIcon={
                    <svg
                      className='h-4 w-4'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <line x1='5' y1='12' x2='19' y2='12'></line>
                      <polyline points='12 5 19 12 12 19'></polyline>
                    </svg>
                  }
                >
                  {t('government.learnMore')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardGrid>

        {/* Banner CTA - mirrors the Kapwa Banner layout with semantic tokens (its default type hardcodes gray-* colors) */}
        <div className='bg-kapwa-bg-surface-raised border-kapwa-border-weak relative mt-12 rounded-lg border p-kapwa-lg'>
          <div className='items-center md:flex'>
            <div className='mb-6 md:mb-0 md:w-2/3 md:pr-8'>
              <h3 className='text-kapwa-text-strong mb-2 text-xl font-semibold'>
                {t('government.directoryTitle')}
              </h3>
              <p className='text-kapwa-text-strong'>
                {t('government.directoryDescription')}
              </p>
            </div>
            <div className='flex justify-center md:w-1/3 md:justify-end'>
              <Button
                onClick={() => navigate('/government/')}
                variant='primary'
                size='lg'
              >
                {t('government.viewDirectory')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GovernmentSection;
