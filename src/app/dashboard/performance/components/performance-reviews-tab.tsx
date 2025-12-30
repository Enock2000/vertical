'use client';

import type { Employee, Goal } from "@/lib/data";
import { EmployeePerformanceCard } from "./employee-performance-card";

interface PerformanceReviewsTabProps {
    employees: Employee[];
    goals: Goal[];
    companyId: string;
}

export function PerformanceReviewsTab({ employees, goals, companyId }: PerformanceReviewsTabProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map(employee => {
                const employeeGoals = goals.filter(g => g.employeeId === employee.id);
                return (
                    <EmployeePerformanceCard
                        key={employee.id}
                        employee={employee}
                        goals={employeeGoals}
                        companyId={companyId}
                    />
                )
            })}
        </div>
    );
}
