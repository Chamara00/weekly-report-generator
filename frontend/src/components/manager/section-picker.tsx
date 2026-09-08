'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SelectField } from '@/components/shared/select-field';

/** Chooses which section of the report to line up across the team. */
export function SectionPicker({ section }: { section: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setSection(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <SelectField
      id="section"
      label="Section"
      value={section}
      className="w-full sm:w-56"
      options={[
        { value: 'BLOCKERS', label: 'Blockers' },
        { value: 'ACHIEVEMENTS', label: 'Achievements' },
      ]}
      onChange={setSection}
    />
  );
}
