import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/customers/table';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchCustomers, fetchFilteredCustomers } from '@/app/lib/data';
import { Metadata } from 'next';
import { CustomersTableType, FormattedCustomersTable } from '@/app/lib/definitions';
 
export const metadata: Metadata = {
  title: {template:'%s Invoices',default:'Invoices'},
};
export default async function Page(props:{
    searchParams?:Promise<{
        query?:string,
        page?:string
    }>
}) {
    const searchParams=await props.searchParams;
    const query=searchParams?.query || '';
    const currentPage=Number(searchParams?.page) || 1;
    const customers=await fetchFilteredCustomers(query);
  return (
    <div className="w-full">
       <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table customers={customers}/>
      </Suspense>
    </div>
  );
}