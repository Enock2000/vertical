
import { ApplicantStatus } from "@/lib/data"
import { CheckCircledIcon, CircleIcon, CrossCircledIcon, QuestionMarkCircledIcon, StopwatchIcon } from "@radix-ui/react-icons"

export const statuses = [
  {
    value: ApplicantStatus.New,
    label: "New",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: ApplicantStatus.Screening,
    label: "Screening",
    icon: CircleIcon,
  },
   {
    value: ApplicantStatus.Interview,
    label: "Interview",
    icon: StopwatchIcon,
  },
  {
    value: ApplicantStatus.Offer,
    label: "Offer",
    icon: CheckCircledIcon,
  },
   {
    value: ApplicantStatus.Onboarding,
    label: "Onboarding",
    icon: CheckCircledIcon,
  },
   {
    value: ApplicantStatus.Hired,
    label: "Hired",
    icon: CheckCircledIcon,
  },
  {
    value: ApplicantStatus.Rejected,
    label: "Rejected",
    icon: CrossCircledIcon,
  },
]
