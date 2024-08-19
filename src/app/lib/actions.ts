"use server";
import { z } from "zod";
//marcar que todas las funciones que se exportan en este archivo son funciones de servidor y por lo tanto no se ejecutan ni se envian al cliente
import { Invoice } from "./definitions";
import { CreateInvoice } from "../ui/invoices/buttons";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.date(),
});

const FormSchema = z.object({
  id: z.string(),
  date: z.date(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
});
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const createInvoiceFormSchema = createInvoiceSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = createInvoiceFormSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  //transformas para evietar errores de redondeo
  const amountIncents = Math.round(amount * 100);
  //creammos la fecha actual 2024/08/18
  const [date] = new Date().toISOString().split("T");

  await sql`
INSERT INTO invoices (customer_id, amount, status, date)
VALUES (${customerId}, ${amountIncents}, ${status}, ${date})
`;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountIncents = Math.round(amount * 100);

  await sql`
UPDATE invoices
SET customer_id = ${customerId}, amount = ${amountIncents}, status = ${status}
WHERE id = ${id}
`;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
