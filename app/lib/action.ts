'use server'
import {z} from 'zod';
import { revalidatePath } from 'next/cache';
import postgres from 'postgres';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
const sql=postgres(process.env.POSTGRES_URL!,{ssl:'require'});
const FormSchema=z.object({
    id:z.string(),
    customerId:z.string({
        invalid_type_error:"Please select a customer"
    }),
    amount:z.coerce.number().gt(0,{message:"Please enter an amount greater than $0"}),
    status:z.enum(['pending','paid'],{
        invalid_type_error:"Please select an invoice status"
    }),
    date:z.string()
});

const CreateInvoice=FormSchema.omit({id:true,date:true});
const UpdateInvoice=FormSchema.omit({id:true,date:true});

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

export async function createInvoice(prevState:State, formdata:FormData){
const validatedFields=CreateInvoice.safeParse({
    customerId:formdata.get('customerId'),
    amount:formdata.get('amount'),
    status:formdata.get('status'),
});

if(!validatedFields.success){
    return{
        errors:validatedFields.error.flatten().fieldErrors,
        message:'Missing Fields. Failed to create invoice'
    }
}

const {customerId,amount,status}=validatedFields.data;
const amountInCents=amount*100;
const date = new Date().toISOString().split('T')[0];
try{

    await sql`Insert into invoices (customer_id,amount,status,date)
    Values(${customerId},${amountInCents},${status},${date})
    `
}catch(error){
    console.error(error)
    return{
        message:"Database Error: Failed to create invoice"
    }
}
revalidatePath('/dashboard/invoices');
redirect('/dashboard/invoices');

//console.log(rawFormData)
}

export async function updateInvoice(id:string,prevSate:State,formdata:FormData){
    const validatedFields=UpdateInvoice.safeParse({
        customerId:formdata.get('customerId'),
        amount:formdata.get('amount'),
        status:formdata.get('status'),
    });
    if(!validatedFields.success){
        return {
            errors:validatedFields.error.flatten().fieldErrors,
            message:"Missing Fields: Failed to Update Invoice"
        }
    }
    const {customerId,amount,status}=validatedFields.data;

    const amountInCents=amount*100;
    try{
        await sql`Update invoices SET customer_id=${customerId},amount=${amountInCents},status=${status}
        WHERE id=${id}
        `
    }catch(error){
        console.error(error)
        return{
            message:"Database Error: Failed to update invoice"
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id:string){
    // throw new Error('Failed to Delete Invoice');
    try{
        await sql`DELETE FROM invoices WHERE id=${id}`
    }catch(error){
        console.error(error)
        return{
            message:"Database Error: Failed to delete invoice"
        }
    }
    revalidatePath('/dashboard/invoices');
}
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }