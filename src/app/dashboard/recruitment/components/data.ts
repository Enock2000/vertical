
import { ApplicantStatus } from "@/lib/data"
import { CheckCircle2, Circle, XCircle, HelpCircle, Timer } from "lucide-react"

export const statuses = [
  {
    value: ApplicantStatus.New,
    label: "New",
    icon: HelpCircle,
  },
  {
    value: ApplicantStatus.Screening,
    label: "Screening",
    icon: Circle,
  },
   {
    value: ApplicantStatus.Interview,
    label: "Interview",
    icon: Timer,
  },
  {
    value: ApplicantStatus.Offer,
    label: "Offer",
    icon: CheckCircle2,
  },
   {
    value: ApplicantStatus.Onboarding,
    label: "Onboarding",
    icon: CheckCircle2,
  },
   {
    value: ApplicantStatus.Hired,
    label: "Hired",
    icon: CheckCircle2,
  },
  {
    value: ApplicantStatus.Rejected,
    label: "Rejected",
    icon: XCircle,
  },
]
