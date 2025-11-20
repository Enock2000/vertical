// src/app/page.tsx   (or any route you prefer)
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { ThumbsUp, Lock, Star, ArrowLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-purple-50">
      {/* ========== Header ========== */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 py-20 md:py-28">
        {/* Background image (replace with your own or keep the Unsplash one) */}
        <Image
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Team meeting"
          fill
          className="object-cover"
          priority
          data-ai-hint="team meeting"
        />
        <div className="absolute inset-0 bg-purple-900/30" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Left column – copy */}
            <div className="max-w-lg">
              <h1 className="text-5xl font-black leading-tight text-gray-900 md:text-6xl">
                The ultimate people platform for scaling companies
              </h1>
              <p className="mt-6 text-lg text-gray-700">
                Unlock efficiency with global reach using <strong>Deel</strong> to streamline{" "}
                <span className="underline decoration-purple-600">payroll</span> for your workforce. With our owned,
                full-scale infrastructure, built for hiring, managing, and paying global talent, you can save on
                software costs and accelerate your market entry with full compliance.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-full bg-gray-900 px-8 text-white hover:bg-gray-800"
                >
                  Get a free demo
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

            {/* Right column – floating stats */}
            <div className="relative flex justify-center">
              <div className="space-y-8">
                {/* Total Payments */}
                <div className="relative -mr-12 w-64 rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">TOTAL PAYMENTS</p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">ZMW340,800</p>
                    </div>
                    <div className="flex -space-x-2">
                      {/* replace with real brand logos if you have them */}
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500" />
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500" />
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-red-500" />
                    </div>
                  </div>
                </div>

                {/* New Joiners */}
                <div className="relative -ml-12 w-64 rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New joiners</p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">2,648</p>
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="h-6 w-6 rounded-sm bg-yellow-200" />
                      <div className="h-8 w-6 rounded-sm bg-yellow-300" />
                      <div className="h-10 w-6 rounded-sm bg-yellow-400" />
                      <div className="h-12 w-6 rounded-sm bg-yellow-500" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Last 4 months</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
