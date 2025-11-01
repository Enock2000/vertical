import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Lock, Star, Check, Flag } from "lucide-react";

export default function EnterprisePage() {
  return (
    <div className="flex min-h-screen flex-col bg-purple-50">
      {/* ========== Top Bar ========== */}
      <header className="bg-[#4B2A7F] text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-2 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <span>Trusted by 35,000+ companies</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400" />
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="ml-1">10,000+ reviews</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Advanced data security</span>
          </div>
        </div>
      </header>

      {/* ========== Hero Section ========== */}
      <section className="relative flex-1 overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 py-16 md:py-24">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1516321310766-90c0e88e60d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Enterprise professional"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-purple-900/20" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Left: Text & CTA */}
            <div className="max-w-lg">
              <p className="text-sm font-medium uppercase tracking-wider text-purple-700">
                Deel for Enterprises
              </p>
              <h1 className="mt-2 text-5xl font-black leading-tight text-gray-900 md:text-6xl">
                Run your global workforce with clarity and control
              </h1>
              <p className="mt-6 text-lg text-gray-700">
                You need more than one tool to run a global team, but you shouldn’t need a dozen providers. Connect enterprise{" "}
                <span className="underline decoration-purple-600">payroll</span>, compliance, contractors, and more in one platform so
                everything works together, costs go down, and your workforce runs more efficiently.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-full bg-gray-900 px-8 text-white hover:bg-gray-800"
                >
                  Get a free 30 minute demo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-gray-900 text-gray-900 hover:bg-gray-100"
                >
                  Speak to sales
                </Button>
              </div>
            </div>

            {/* Right: Floating Payroll Dashboard */}
            <div className="relative flex justify-center">
              <div className="space-y-8">
                {/* Payroll Card */}
                <div className="relative -mr-16 w-80 rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Acme Inc.</span>
                        <Flag className="h-4 w-4 text-red-600" />
                      </div>
                      <p className="text-sm text-gray-600">United States</p>
                    </div>
                    <select className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                      <option>Q4</option>
                    </select>
                  </div>

                  <div className="mt-6 space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">NET SALARIES</span>
                      <span className="flex items-center gap-1 font-semibold text-green-600">
                        $1,761,300 <Check className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">SOCIAL SECURITY</span>
                      <span className="flex items-center gap-1 font-semibold text-green-600">
                        $264,500 <Check className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">LIABILITIES</span>
                      <span className="flex items-center gap-1 font-semibold text-green-600">
                        $320,000 <Check className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="font-semibold">TOTAL COSTS</span>
                      <span className="flex items-center gap-1 font-bold text-green-600">
                        $2,345,800 <Check className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Right Badge */}
                <div className="relative -ml-20 mt-4 w-72 rounded-2xl bg-white p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">November payroll complete</span>
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">$781,933.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
