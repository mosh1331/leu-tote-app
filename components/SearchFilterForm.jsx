// components/SearchFilterForm.jsx
'use client';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { searchFilterSchema } from '@/lib/validationSchemas';
import { useRouter } from 'next/navigation';

export default function SearchFilterForm({ currentQuery = '', currentBrand = '' }) {
  const router = useRouter();
  const { register, handleSubmit } = useForm({
    resolver: yupResolver(searchFilterSchema),
    defaultValues: { query: currentQuery, brand: currentBrand }
  });

  const onSubmit = (data) => {
    const params = new URLSearchParams();
    if (data.query) params.set('q', data.query);
    if (data.brand && data.brand !== 'All') params.set('brand', data.brand);
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative flex items-center space-x-2">
      <div className="relative flex-1">
        <input
          {...register('query')}
          type="text"
          placeholder="Search bags, totes, clutches..."
          className="w-full pl-4 pr-4 py-2.5 bg-white rounded-theme-md text-xs font-medium text-themeText-primary placeholder-themeText-muted border border-black/5 shadow-sm focus:outline-none"
        />
      </div>
      <button type="submit" className="h-10 px-4 bg-white rounded-theme-md flex items-center justify-center text-xs font-semibold border border-black/5">
        Search
      </button>
    </form>
  );
}