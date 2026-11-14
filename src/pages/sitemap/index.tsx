import { FC, ReactNode } from 'react';

import { Link } from 'react-router-dom';

import {
  BarChart3,
  Building2,
  ChevronRight,
  FileCheck,
  FileText,
  Home,
  Landmark,
  Scale,
} from 'lucide-react';

import { SEO } from '@/components/layout/SEO';
import { config } from '@/lib/lguConfig';

import serviceCategories from '@/data/service_categories.json';

interface SitemapSection {
  title: string;
  icon: ReactNode;
  links: {
    title: string;
    url: string;
    description?: string;
  }[];
}

const SitemapPage: FC = () => {
  // Every url here must match a route in src/App.tsx; gated sections follow config.features
  const sitemapSections: SitemapSection[] = [
    {
      title: 'Main Pages',
      icon: <Home className='w-5 h-5' />,
      links: [
        { title: 'Home', url: '/', description: 'Main landing page' },
        {
          title: 'About',
          url: '/about',
          description: `About ${config.portal.name}`,
        },
        {
          title: 'Contact',
          url: '/contact',
          description: 'Get in touch with the team',
        },
        {
          title: 'Accessibility',
          url: '/accessibility',
          description: 'Accessibility statement and features',
        },
        {
          title: 'Search',
          url: '/search',
          description: 'Search the entire site',
        },
        {
          title: 'Contribute',
          url: '/contribute',
          description: 'Help improve the portal',
        },
        {
          title: 'Join Us',
          url: '/join-us',
          description: 'Volunteer with the community',
        },
        {
          title: 'Terms of Service',
          url: '/terms-of-service',
          description: 'Terms for using this portal',
        },
      ],
    },
    {
      title: 'Government',
      icon: <Building2 className='w-5 h-5' />,
      links: [
        {
          title: 'Elected Officials',
          url: '/government/elected-officials',
          description: 'Mayor, Vice Mayor, and Sangguniang Bayan members',
        },
        {
          title: 'Municipal Committees',
          url: '/government/elected-officials/committees',
          description: 'Standing committees of the Sangguniang Bayan',
        },
        {
          title: 'Departments',
          url: '/government/departments',
          description: 'Municipal offices and department heads',
        },
        {
          title: 'Barangays',
          url: '/government/barangays',
          description: 'Directory of component barangays',
        },
      ],
    },
    {
      title: 'Services',
      icon: <FileText className='w-5 h-5' />,
      links: [
        {
          title: 'All Services',
          url: '/services',
          description: 'Browse all government services',
        },
        ...serviceCategories.categories.map(category => ({
          title: category.name,
          url: `/services?category=${category.slug}`,
        })),
      ],
    },
    ...(config.features.statistics
      ? [
          {
            title: 'Statistics',
            icon: <BarChart3 className='w-5 h-5' />,
            links: [
              {
                title: 'Population',
                url: '/statistics/population',
                description: 'Census population and growth',
              },
              {
                title: 'Municipal Income',
                url: '/statistics/municipal-income',
                description: 'Revenue sources and income trends',
              },
              {
                title: 'Competitiveness',
                url: '/statistics/competitiveness',
                description: 'CMCI scores and rankings',
              },
            ],
          },
        ]
      : []),
    ...(config.features.transparency
      ? [
          {
            title: 'Transparency',
            icon: <Scale className='w-5 h-5' />,
            links: [
              {
                title: 'Transparency Overview',
                url: '/transparency',
                description: 'Public finance and project records',
              },
              {
                title: 'Financial Reports',
                url: '/transparency/financial',
                description: 'Statement of receipts and expenditures',
              },
              {
                title: 'Procurement',
                url: '/transparency/procurement',
                description: 'Bids and awarded contracts',
              },
              {
                title: 'Infrastructure Projects',
                url: '/transparency/infrastructure',
                description: 'Public works and project status',
              },
            ],
          },
        ]
      : []),
    ...(config.features.openLGU
      ? [
          {
            title: 'OpenLGU',
            icon: <Landmark className='w-5 h-5' />,
            links: [
              {
                title: 'Legislation',
                url: '/openlgu',
                description: 'Ordinances and resolutions',
              },
              {
                title: 'Officials',
                url: '/openlgu/officials',
                description: 'Legislators and their records',
              },
              {
                title: 'Legislative Terms',
                url: '/openlgu/terms',
                description: 'Sangguniang Bayan terms',
              },
            ],
          },
        ]
      : []),
    {
      title: 'Data Services',
      icon: <FileCheck className='w-5 h-5' />,
      links: [
        {
          title: 'Weather',
          url: '/data/weather',
          description: 'Real-time weather information',
        },
        {
          title: 'Foreign Exchange Rates',
          url: '/data/forex',
          description: 'Current foreign exchange rates',
        },
      ],
    },
  ];

  return (
    <div className='py-12 min-h-screen bg-kapwa-bg-surface-raised'>
      <SEO
        title='Sitemap'
        description='Complete sitemap — find all pages and services available on this portal.'
        keywords={[
          'sitemap',
          'navigation',
          'government services',
          'philippines government',
          'website map',
        ]}
      />

      <div className='container mx-auto px-4 py-8 md:py-12'>
        <div className='mx-auto max-w-5xl'>
          <div className='overflow-hidden rounded-xl bg-kapwa-bg-surface shadow-xs'>
            <div className='p-6 border-b border-kapwa-border-weak md:p-8'>
              <h1 className='text-kapwa-text-strong kapwa-heading-xl font-extrabold'>
                Sitemap
              </h1>
              <p className='mt-2 text-kapwa-text-support'>
                A complete guide to all pages and services available on
                {config.portal.name}
              </p>
            </div>

            <div className='p-6 md:p-8'>
              <div className='space-y-12'>
                {sitemapSections.map((section, index) => (
                  <div key={index}>
                    <div className='flex items-center mb-4'>
                      <div className='p-2 mr-3 rounded-md bg-kapwa-bg-surface text-kapwa-text-brand'>
                        {section.icon}
                      </div>
                      <h2 className='text-xl font-bold text-kapwa-text-strong'>
                        {section.title}
                      </h2>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                      {section.links.map((link, linkIndex) => (
                        <Link
                          key={linkIndex}
                          to={link.url}
                          className='flex flex-col p-4 rounded-lg border transition-colors group hover:border-kapwa-border-brand hover:bg-kapwa-bg-surface-brand border-kapwa-border-weak'
                        >
                          <div className='flex justify-between items-center mb-2'>
                            <h3 className='font-medium group-hover:text-kapwa-text-brand text-kapwa-text-strong'>
                              {link.title}
                            </h3>
                            <ChevronRight className='w-4 h-4 group-hover:text-kapwa-text-link text-kapwa-text-disabled' />
                          </div>
                          {link.description && (
                            <p className='text-sm text-kapwa-text-support'>
                              {link.description}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='mt-8 text-sm text-center text-kapwa-text-support'>
            <p>
              Can&apos;t find what you&apos;re looking for? Try using our{' '}
              <Link to='/search' className='text-kapwa-text-brand underline'>
                search feature
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;
