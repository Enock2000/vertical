// src/app/dashboard/finance/components/overview-tab.tsx
'use client';

import { useMemo } from 'react';
import type { Invoice, Transaction } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';

interface OverviewTabProps {
  invoices: Invoice[];
  transactions: Transaction[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function OverviewTab({ invoices, transactions }: OverviewTabProps) {
  const totalRevenue = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netIncome = totalRevenue - totalExpenses;
  
  const incomeVsExpenseData = useMemo(() => {
      const now = new Date();
      const monthLabels = Array.from({ length: 6 }, (_, i) => subMonths(now, i)).reverse();

      return monthLabels.map(month => {
          const monthKey = format(month, 'yyyy-MM');
          const income = transactions
              .filter(t => t.type === 'Income' && t.date.startsWith(monthKey))
              .reduce((sum, t) => sum + t.amount, 0);
          const expense = transactions
              .filter(t => t.type === 'Expense' && t.date.startsWith(monthKey))
              .reduce((sum, t) => sum + t.amount, 0);
          
          return {
              name: format(month, 'MMM'),
              income,
              expense
          }
      });
  }, [transactions]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">from all income transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(totalExpenses)}</div>
             <p className="text-xs text-muted-foreground">from all expense transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(netIncome)}</div>
             <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
        </CardHeader>
        <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
                <BarChart data={incomeVsExpenseData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => currencyFormatter.format(value)} />
                    <Tooltip content={<ChartTooltipContent formatter={(value) => currencyFormatter.format(value as number)}/>} />
                    <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
        </CardContent>
       </Card>
    </div>
  );
}
