import { CreditCard, Hammer, Truck } from 'lucide-react';

import {
  SidebarContainer,
  SidebarItem,
} from '@/components/navigation/SidebarNavigation';

const sections = [
  {
    name: 'Budget & Finances',
    slug: 'financial',
    icon: CreditCard,
  },
  {
    name: 'Procurement',
    slug: 'procurement',
    icon: Hammer,
  },
  {
    name: 'DPWH Projects',
    slug: 'infrastructure',
    icon: Truck,
  },
];

export default function TransparencySidebar() {
  return (
    <SidebarContainer title='Transparency'>
      <ul className='space-y-1'>
        {sections.map(section => (
          <SidebarItem
            key={section.slug}
            label={section.name}
            icon={section.icon}
            path={`${section.slug}`}
          />
        ))}
      </ul>
    </SidebarContainer>
  );
}
