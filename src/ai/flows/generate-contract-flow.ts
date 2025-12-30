// src/ai/flows/generate-contract-flow.ts
'use server';

/**
 * @fileOverview Generates a professional employment contract.
 */

import { z } from 'zod';

const GenerateContractInputSchema = z.object({
    employeeName: z.string().describe("The full name of the employee."),
    jobTitle: z.string().describe("The official job title for the position."),
    companyName: z.string().describe("The legal name of the company."),
    salary: z.number().describe("The annual gross salary."),
    contractType: z.enum(['Permanent', 'Fixed-Term', 'Internship']).describe("The type of employment contract."),
    contractStartDate: z.string().describe("The start date of the employment."),
    contractEndDate: z.string().optional().describe("The end date of the employment, if applicable."),
    companyAddress: z.string().optional().describe("The address of the company."),
    employeeAddress: z.string().optional().describe("The address of the employee."),
    employeeNRC: z.string().optional().describe("The employee's NRC number."),
    template: z.enum(['Standard', 'Simple']).optional().describe("The contract template to use."),
});

export type GenerateContractInput = z.infer<typeof GenerateContractInputSchema>;

export interface GenerateContractOutput {
    contractText: string;
}

export async function generateContract(
    input: GenerateContractInput
): Promise<GenerateContractOutput> {
    const template = input.template || 'Standard';

    return {
        contractText: template === 'Simple'
            ? generateSimpleContract(input)
            : generateComprehensiveContract(input),
    };
}

function generateSimpleContract(input: GenerateContractInput): string {
    const currentDate = new Date().toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' });
    const monthlySalary = (input.salary / 12).toLocaleString('en-ZM', { minimumFractionDigits: 2 });

    return `
===============================================================================
                           EMPLOYMENT AGREEMENT
===============================================================================

Date: ${currentDate}

1. PARTIES

   Employer: ${input.companyName}
   Address:  ${input.companyAddress || 'N/A'}

   Employee: ${input.employeeName}
   NRC No:   ${input.employeeNRC || 'N/A'}
   Address:  ${input.employeeAddress || 'N/A'}

2. POSITION

   The Employee is appointed to the position of: ${input.jobTitle}

3. DURATION

   Start Date: ${input.contractStartDate}
   ${input.contractEndDate ? `End Date:   ${input.contractEndDate}` : 'Type:       Permanent Contract'}

4. SALARY

   Monthly Gross Salary: ZMW ${monthlySalary}
   Payable monthly in arrears.

5. HOURS OF WORK

   Standard hours: 08:00 to 17:00, Monday to Friday.
   48 hours per week total.

6. LEAVE

   Annual Leave: 2 days per month (24 days/year).
   Sick Leave:   In accordance with Zambian Employment Code Act.

7. TERMINATION

   Notice Period: 1 Month (after probation).
   Probation:     3 Months.

===============================================================================
   SIGNATURES
===============================================================================

For: ${input.companyName}


___________________________
Authorized Signature


Date: _____________________


Employee: ${input.employeeName}


___________________________
Signature


Date: _____________________
===============================================================================
`;
}

function generateComprehensiveContract(input: GenerateContractInput): string {

    const currentDate = new Date().toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' });
    const monthlySalary = (input.salary / 12).toLocaleString('en-ZM', { minimumFractionDigits: 2 });
    const annualSalary = input.salary.toLocaleString('en-ZM', { minimumFractionDigits: 2 });

    return `
═══════════════════════════════════════════════════════════════════════════════
                              EMPLOYMENT CONTRACT
═══════════════════════════════════════════════════════════════════════════════
                    CONTRACT OF EMPLOYMENT
                           made pursuant to
            THE EMPLOYMENT CODE ACT NO. 3 OF 2019
                       LAWS OF ZAMBIA

═══════════════════════════════════════════════════════════════════════════════

Date: ${currentDate}
Contract Reference: EC-${Date.now().toString(36).toUpperCase()}

═══════════════════════════════════════════════════════════════════════════════
                              PARTIES
═══════════════════════════════════════════════════════════════════════════════

THIS CONTRACT OF EMPLOYMENT is made and entered into on ${input.contractStartDate}

BETWEEN:

${input.companyName.toUpperCase()}
(hereinafter referred to as "the Employer")
${input.companyAddress || 'Registered in the Republic of Zambia'}

AND

${input.employeeName.toUpperCase()}
(hereinafter referred to as "the Employee")
${input.employeeNRC ? `NRC: ${input.employeeNRC}` : ''}
${input.employeeAddress || ''}

WHEREAS the Employer desires to engage the services of the Employee and the 
Employee has agreed to render such services to the Employer on the terms and 
conditions hereinafter set out.

NOW THEREFORE IT IS HEREBY AGREED as follows:


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 1
                         INTERPRETATION
═══════════════════════════════════════════════════════════════════════════════

1.1 DEFINITIONS

In this Contract, unless the context otherwise indicates:

"Act" means the Employment Code Act No. 3 of 2019 and any amendments thereto;

"Basic Salary" means the monthly remuneration payable to the Employee excluding 
allowances, bonuses, overtime payments, and other benefits;

"Company" or "Employer" means ${input.companyName};

"Confidential Information" means all information, whether written or oral, 
relating to the business, operations, customers, employees, finances, or 
affairs of the Company that is not in the public domain;

"Contract" means this Employment Contract and any amendments hereto;

"Employee" means ${input.employeeName};

"Gross Misconduct" means conduct of such a serious nature that it fundamentally 
breaches the employment relationship, including but not limited to theft, fraud, 
assault, gross insubordination, or being under the influence of alcohol or 
drugs during working hours;

"Intellectual Property" means all patents, trademarks, service marks, trade 
names, copyrights, designs, inventions, discoveries, improvements, processes, 
and any other intellectual property rights;

"Normal Working Hours" means the standard working hours as defined in this 
Contract or as may be varied from time to time by the Employer;

"Probationary Period" means the initial period of employment during which the 
Employee's suitability for the position is assessed.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 2
                    APPOINTMENT AND POSITION
═══════════════════════════════════════════════════════════════════════════════

2.1 POSITION

The Employer hereby appoints the Employee to the position of:

    POSITION TITLE: ${input.jobTitle.toUpperCase()}

The Employee hereby accepts such appointment on the terms and conditions set 
forth in this Contract.

2.2 DUTIES AND RESPONSIBILITIES

2.2.1 The Employee shall perform all duties and responsibilities associated 
with the position as may be assigned by the Employer from time to time.

2.2.2 The Employee shall:

    (a) Diligently and faithfully serve the Employer and use best endeavors 
        to promote the interests of the Employer;
    
    (b) Obey all lawful and reasonable instructions given by the Employer or 
        any authorized representative;
    
    (c) Perform duties with due care, skill, and competence;
    
    (d) Comply with all policies, procedures, rules, and regulations of the 
        Employer as may be in force from time to time;
    
    (e) Report any matter coming to the Employee's attention that may be 
        detrimental to the interests of the Employer;
    
    (f) Maintain complete confidentiality regarding all Company affairs;
    
    (g) Not engage in any conduct that may bring the Company into disrepute.

2.3 REPORTING STRUCTURE

The Employee shall report directly to their designated supervisor or manager 
as may be communicated by the Employer from time to time.

2.4 PLACE OF WORK

The Employee's primary place of work shall be at the Employer's premises or 
such other location as the Employer may reasonably require.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 3
                    TYPE AND DURATION OF CONTRACT
═══════════════════════════════════════════════════════════════════════════════

3.1 CONTRACT TYPE

This is a ${input.contractType.toUpperCase()} employment contract.

3.2 COMMENCEMENT DATE

This Contract shall commence on ${input.contractStartDate}.

${input.contractType === 'Fixed-Term' || input.contractType === 'Internship' ? `
3.3 CONTRACT END DATE

This Contract shall terminate on ${input.contractEndDate || 'a date to be determined by mutual agreement'}, 
unless terminated earlier in accordance with the provisions hereof or extended 
by mutual written agreement of the parties.

3.4 RENEWAL

Upon expiration of this Contract, it may be renewed by mutual written agreement 
between the parties, subject to satisfactory performance and the needs of the 
Employer.
` : `
3.3 DURATION

This Contract shall continue in force until terminated in accordance with the 
provisions set out herein.
`}


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 4
                        PROBATIONARY PERIOD
═══════════════════════════════════════════════════════════════════════════════

4.1 PROBATION

The Employee shall serve a probationary period of THREE (3) MONTHS commencing 
from the date of appointment.

4.2 PURPOSE

4.2.1 The purpose of the probationary period is to assess:

    (a) The Employee's suitability for the position;
    (b) The Employee's ability to perform the required duties;
    (c) The Employee's conduct and behavior in the workplace;
    (d) The Employee's compatibility with the organization's culture.

4.3 EXTENSION

4.3.1 The probationary period may be extended by a further period not exceeding 
THREE (3) MONTHS if the Employer considers it necessary to further assess 
the Employee's suitability.

4.3.2 Written notice of any extension shall be given to the Employee before 
the expiration of the initial probationary period.

4.4 CONFIRMATION

4.4.1 Upon successful completion of the probationary period, the Employee 
shall be confirmed in writing as having passed probation.

4.4.2 Confirmation shall be subject to satisfactory performance, conduct, 
and attendance during the probationary period.

4.5 TERMINATION DURING PROBATION

4.5.1 During the probationary period, either party may terminate this Contract 
by giving FOURTEEN (14) DAYS written notice or payment in lieu thereof.

4.5.2 The Employer may terminate this Contract without notice in cases of 
gross misconduct.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 5
                           REMUNERATION
═══════════════════════════════════════════════════════════════════════════════

5.1 BASIC SALARY

5.1.1 The Employee shall receive a gross annual salary of:

    ANNUAL SALARY:  ZMW ${annualSalary}
    MONTHLY SALARY: ZMW ${monthlySalary}

5.1.2 The salary shall be paid monthly in arrears on or before the last 
working day of each month by electronic transfer to the Employee's designated 
bank account.

5.2 STATUTORY DEDUCTIONS

5.2.1 The following statutory deductions shall be made from the Employee's 
gross salary:

    (a) Pay As You Earn (PAYE) - In accordance with the Income Tax Act;
    
    (b) National Pension Scheme Authority (NAPSA) - Employee's contribution 
        of 5% of gross earnings (capped accordingly);
    
    (c) National Health Insurance Management Authority (NHIMA) - Employee's 
        contribution of 1% of gross earnings.

5.2.2 The Employer shall make the following contributions on behalf of the 
Employee:

    (a) NAPSA - Employer's contribution of 5% of gross earnings;
    (b) NHIMA - Employer's contribution of 1% of gross earnings.

5.3 SALARY REVIEW

5.3.1 The Employee's salary may be reviewed annually by the Employer, taking 
into account factors such as performance, inflation, market rates, and the 
financial position of the Company.

5.3.2 Any salary increase shall be at the sole discretion of the Employer and 
shall not be guaranteed.

5.4 ALLOWANCES AND BENEFITS

5.4.1 In addition to the basic salary, the Employee may be entitled to such 
allowances and benefits as may be determined by the Employer from time to time.

5.4.2 Any allowances and benefits provided shall be subject to the Employer's 
policies and may be varied or withdrawn at the Employer's discretion.

5.5 OVERTIME

5.5.1 Overtime work shall only be performed when authorized in advance by the 
Employee's supervisor.

5.5.2 Compensation for overtime shall be in accordance with the Employment 
Code Act and the Employer's overtime policy.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 6
                           WORKING HOURS
═══════════════════════════════════════════════════════════════════════════════

6.1 NORMAL WORKING HOURS

6.1.1 The Employee's normal working hours shall be FORTY-EIGHT (48) HOURS per 
week, exclusive of meal breaks.

6.1.2 Standard working hours are Monday to Friday from 08:00 hours to 17:00 
hours, with a one-hour lunch break.

6.1.3 The Employer reserves the right to vary the working hours as may be 
required by the nature of the business.

6.2 FLEXIBILITY

The Employee acknowledges that the nature of the position may require flexibility 
in working hours, including but not limited to working outside normal hours, 
on weekends, or on public holidays when reasonably required by the Employer.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 7
                          LEAVE ENTITLEMENTS
═══════════════════════════════════════════════════════════════════════════════

7.1 ANNUAL LEAVE

7.1.1 The Employee shall be entitled to TWENTY-FOUR (24) WORKING DAYS of 
annual leave per calendar year, with full pay.

7.1.2 Leave shall accrue at the rate of TWO (2) days per month of employment.

7.1.3 Annual leave shall be taken at times mutually agreed upon between the 
Employee and the Employer, taking into account the operational requirements 
of the business.

7.1.4 Leave not taken within the leave year may be carried forward to the 
following year, subject to the Employer's leave policy, or may be forfeited.

7.2 SICK LEAVE

7.2.1 The Employee shall be entitled to sick leave with full pay for a period 
not exceeding TWENTY-SIX (26) DAYS in any period of TWELVE (12) months.

7.2.2 The Employee shall notify the Employer of any illness or injury as soon 
as practicable on the first day of absence.

7.2.3 A medical certificate from a registered medical practitioner shall be 
required for any absence exceeding TWO (2) consecutive working days.

7.3 MATERNITY LEAVE

7.3.1 A female Employee shall be entitled to maternity leave of FOURTEEN (14) 
WEEKS with full pay, subject to the provisions of the Employment Code Act.

7.3.2 At least THREE (3) weeks of leave must be taken before the expected 
date of delivery.

7.4 PATERNITY LEAVE

7.4.1 A male Employee shall be entitled to paternity leave of FIVE (5) 
WORKING DAYS with full pay upon the birth of his child.

7.5 COMPASSIONATE LEAVE

7.5.1 The Employee shall be entitled to compassionate leave of up to SEVEN (7) 
days per annum in the event of the death of an immediate family member.

7.6 PUBLIC HOLIDAYS

7.6.1 The Employee shall be entitled to all gazetted public holidays in Zambia 
with full pay.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 8
                         DISCIPLINARY CODE
═══════════════════════════════════════════════════════════════════════════════

8.1 DISCIPLINE POLICY

8.1.1 The Employee shall be subject to the Employer's disciplinary policies 
and procedures, which are designed to ensure fair and consistent treatment 
of all employees.

8.2 CATEGORIES OF MISCONDUCT

8.2.1 Minor Misconduct includes but is not limited to:
    - Lateness
    - Poor timekeeping
    - Minor breaches of Company policies
    - Negligence in the performance of duties

8.2.2 Serious Misconduct includes but is not limited to:
    - Repeated minor misconduct
    - Insubordination
    - Unauthorized absence
    - Breach of confidentiality

8.2.3 Gross Misconduct includes but is not limited to:
    - Theft, fraud, or dishonesty
    - Violence or assault
    - Being under the influence of alcohol or drugs at work
    - Gross negligence resulting in significant loss or damage
    - Sexual harassment
    - Gross insubordination

8.3 DISCIPLINARY PROCEDURE

8.3.1 In all cases of alleged misconduct, the Employee shall be entitled to:
    - Be informed of the nature of the allegations;
    - Have an opportunity to respond to the allegations;
    - Be represented by a colleague or union representative;
    - Appeal any disciplinary decision.

8.4 SANCTIONS

8.4.1 Disciplinary sanctions may include:
    - Verbal warning
    - Written warning
    - Final written warning
    - Suspension with or without pay
    - Demotion
    - Dismissal


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 9
                           CONFIDENTIALITY
═══════════════════════════════════════════════════════════════════════════════

9.1 CONFIDENTIALITY OBLIGATION

9.1.1 The Employee acknowledges that in the course of employment, they may 
have access to Confidential Information belonging to the Employer.

9.1.2 The Employee agrees to keep all Confidential Information strictly 
confidential and shall not, during the term of employment or thereafter:

    (a) Use any Confidential Information for any purpose other than the 
        proper performance of duties;
    
    (b) Disclose any Confidential Information to any third party without 
        prior written consent of the Employer;
    
    (c) Copy, reproduce, or store any Confidential Information except as 
        required for the performance of duties.

9.2 DURATION

The obligations of confidentiality shall continue indefinitely after the 
termination of employment.

9.3 RETURN OF MATERIALS

Upon termination of employment, the Employee shall immediately return to the 
Employer all documents, materials, and property containing or relating to 
Confidential Information.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 10
                       INTELLECTUAL PROPERTY
═══════════════════════════════════════════════════════════════════════════════

10.1 OWNERSHIP

10.1.1 All Intellectual Property created, developed, or discovered by the 
Employee in the course of employment or relating to the business of the 
Employer shall be the exclusive property of the Employer.

10.1.2 The Employee hereby assigns to the Employer all rights, title, and 
interest in and to such Intellectual Property.

10.2 DISCLOSURE

The Employee agrees to promptly disclose to the Employer all inventions, 
discoveries, improvements, and innovations made during the course of employment.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 11
                     CONFLICT OF INTEREST
═══════════════════════════════════════════════════════════════════════════════

11.1 PROHIBITION

11.1.1 The Employee shall not, without the prior written consent of the Employer:

    (a) Engage in any business, trade, or occupation that may conflict with 
        the interests of the Employer;
    
    (b) Have any financial interest in any competitor of the Employer;
    
    (c) Accept any gifts, gratuities, or entertainment from any person or 
        entity having business dealings with the Employer, except nominal 
        gifts of minimal value.

11.2 DISCLOSURE

The Employee shall promptly disclose to the Employer any actual or potential 
conflict of interest.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 12
                    TERMINATION OF EMPLOYMENT
═══════════════════════════════════════════════════════════════════════════════

12.1 NOTICE PERIOD

12.1.1 After successful completion of the probationary period, either party 
may terminate this Contract by giving ONE (1) MONTH written notice or payment 
in lieu thereof.

12.1.2 The Employer reserves the right to require the Employee to work during 
the notice period or to place the Employee on garden leave.

12.2 SUMMARY DISMISSAL

12.2.1 The Employer may terminate this Contract without notice in cases of 
gross misconduct or fundamental breach of this Contract by the Employee.

12.3 TERMINATION BY EMPLOYEE

12.3.1 The Employee may terminate this Contract by giving the required notice 
in writing to the Employer.

12.4 RETIREMENT

12.4.1 The normal retirement age shall be as stipulated in the Employer's 
retirement policy or as provided by law.

12.5 REDUNDANCY

12.5.1 In the event of redundancy, the Employer shall comply with the 
provisions of the Employment Code Act regarding redundancy payments and 
procedures.

12.6 DEATH OR INCAPACITY

12.6.1 This Contract shall terminate automatically upon the death of the 
Employee. Benefits shall be paid to the Employee's designated beneficiaries 
or estate as applicable.

12.7 HANDOVER

12.7.1 Upon termination of employment, the Employee shall:

    (a) Return all Company property, including but not limited to keys, 
        access cards, equipment, documents, and vehicles;
    
    (b) Provide a comprehensive handover of all work in progress;
    
    (c) Settle any outstanding loans or advances;
    
    (d) Provide forwarding contact information.

12.8 FINAL PAYMENT

12.8.1 Upon termination, the Employee shall be entitled to:

    (a) Salary for the period worked;
    (b) Payment in lieu of any accrued but untaken annual leave;
    (c) Any other amounts due under this Contract or by law.

12.8.2 The Employer may deduct from the final payment any amounts owed by 
the Employee to the Employer.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 13
                         RESTRAINT OF TRADE
═══════════════════════════════════════════════════════════════════════════════

13.1 NON-COMPETE

13.1.1 For a period of SIX (6) MONTHS following termination of employment, 
the Employee shall not, without the prior written consent of the Employer:

    (a) Engage in any business that competes with the Employer;
    (b) Solicit or entice away any employee of the Employer;
    (c) Solicit or divert any client or customer of the Employer.

13.2 ENFORCEABILITY

If any provision of this Section is held to be unenforceable, the remaining 
provisions shall continue in full force and effect.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 14
                         GENERAL PROVISIONS
═══════════════════════════════════════════════════════════════════════════════

14.1 ENTIRE AGREEMENT

This Contract constitutes the entire agreement between the parties and 
supersedes all prior negotiations, representations, warranties, and agreements 
relating to the subject matter hereof.

14.2 AMENDMENTS

No amendment or variation of this Contract shall be valid unless made in 
writing and signed by both parties.

14.3 WAIVER

No failure or delay by either party in exercising any right or remedy shall 
constitute a waiver thereof.

14.4 SEVERABILITY

If any provision of this Contract is held to be invalid or unenforceable, 
the remaining provisions shall continue in full force and effect.

14.5 GOVERNING LAW

This Contract shall be governed by and construed in accordance with the 
laws of the Republic of Zambia.

14.6 DISPUTE RESOLUTION

14.6.1 Any dispute arising out of or in connection with this Contract shall 
first be attempted to be resolved through negotiation between the parties.

14.6.2 If the dispute cannot be resolved through negotiation, it shall be 
referred to mediation or arbitration in accordance with the laws of Zambia.

14.7 NOTICES

Any notice required or permitted under this Contract shall be in writing and 
shall be deemed to have been duly given when delivered personally or sent by 
registered mail to the addresses of the parties as set out herein.


═══════════════════════════════════════════════════════════════════════════════
                              SECTION 15
                            DECLARATIONS
═══════════════════════════════════════════════════════════════════════════════

15.1 EMPLOYEE DECLARATIONS

The Employee hereby declares that:

    (a) The information provided in the job application and during the 
        recruitment process is true and accurate;
    
    (b) There are no circumstances that would prevent the Employee from 
        performing the duties of the position;
    
    (c) The Employee has read, understood, and agrees to comply with the 
        terms and conditions of this Contract;
    
    (d) The Employee has had the opportunity to seek independent legal 
        advice before signing this Contract.


═══════════════════════════════════════════════════════════════════════════════
                              SIGNATURES
═══════════════════════════════════════════════════════════════════════════════

IN WITNESS WHEREOF, the parties have executed this Contract on the date 
first written above.


FOR AND ON BEHALF OF THE EMPLOYER:

${input.companyName.toUpperCase()}


Signature: _________________________________

Name:      _________________________________

Position:  _________________________________

Date:      _________________________________


EMPLOYEE:


Signature: _________________________________

Name:      ${input.employeeName.toUpperCase()}

NRC No:    _________________________________

Date:      _________________________________


═══════════════════════════════════════════════════════════════════════════════

WITNESS (OPTIONAL):


Signature: _________________________________

Name:      _________________________________

NRC No:    _________________________________

Date:      _________________________________


═══════════════════════════════════════════════════════════════════════════════
                              SCHEDULE A
                         JOB DESCRIPTION
═══════════════════════════════════════════════════════════════════════════════

Position: ${input.jobTitle}

Department: ________________________________

Reports To: ________________________________


KEY RESPONSIBILITIES:

1. ________________________________________________________________________

2. ________________________________________________________________________

3. ________________________________________________________________________

4. ________________________________________________________________________

5. ________________________________________________________________________


QUALIFICATIONS AND EXPERIENCE:

• __________________________________________________________________________

• __________________________________________________________________________

• __________________________________________________________________________


SKILLS AND COMPETENCIES:

• __________________________________________________________________________

• __________________________________________________________________________

• __________________________________________________________________________


═══════════════════════════════════════════════════════════════════════════════
                              SCHEDULE B
                       SALARY AND BENEFITS
═══════════════════════════════════════════════════════════════════════════════

REMUNERATION PACKAGE:

Basic Salary (Annual):     ZMW ${annualSalary}

Basic Salary (Monthly):    ZMW ${monthlySalary}

ALLOWANCES:

Transport Allowance:       ZMW ______________

Housing Allowance:         ZMW ______________

Lunch Allowance:          ZMW ______________

Other Allowances:         ZMW ______________


TOTAL MONTHLY PACKAGE:    ZMW ______________


BENEFITS:

☐ Medical Insurance
☐ Group Life Insurance
☐ Pension Fund (in addition to NAPSA)
☐ Company Vehicle
☐ Fuel Allowance
☐ Mobile Phone Allowance
☐ Other: ________________________________


═══════════════════════════════════════════════════════════════════════════════
                         END OF CONTRACT
═══════════════════════════════════════════════════════════════════════════════

This contract has been prepared in accordance with the Employment Code Act 
No. 3 of 2019 and other relevant laws of the Republic of Zambia.

Document Generated: ${currentDate}
Generated by VerticalSync HR Management System
Powered by Oran Investment

═══════════════════════════════════════════════════════════════════════════════
`;
}
