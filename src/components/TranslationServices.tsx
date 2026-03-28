import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, FileCheck2, Languages, Mail, ShieldCheck, Stamp } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const processSteps = [
  {
    title: "Upload your documents for free",
    description:
      "Start the translation order without paying upfront. Send clear scans or photos and tell us the language pair you need.",
  },
  {
    title: "We prepare your certified translation",
    description:
      "Our team completes the translation and prepares a watermarked review copy so you can check the content before paying.",
  },
  {
    title: "Preview online and choose delivery options",
    description:
      "Open the secure review page, inspect the preview, add notarization or mailing if needed, and approve when ready.",
  },
  {
    title: "Unlock and download the final file",
    description:
      "Once purchased, you get the clean final PDF immediately, with optional mailed and notarized delivery available.",
  },
];

const includedDocs = [
  "Birth certificates",
  "Marriage certificates",
  "Academic transcripts",
  "Diplomas and degrees",
  "Tax returns and financial records",
  "Legal and immigration paperwork",
];

const reasons = [
  {
    icon: Eye,
    title: "Preview before payment",
    description:
      "Customers can inspect the translated document first instead of paying blindly upfront.",
  },
  {
    icon: ShieldCheck,
    title: "Accepted certified format",
    description:
      "Built for official use cases, including USCIS-style certified translation requirements and formal submissions.",
  },
  {
    icon: Stamp,
    title: "Add notarization and mailing",
    description:
      "Need more than a PDF? Customers can choose notarization and physical delivery during checkout.",
  },
];

const faqs = [
  {
    question: "Do I have to pay before the translation is done?",
    answer:
      "No. You can submit your translation request for free. We prepare the translation first and then send you a secure preview page.",
  },
  {
    question: "What does the preview include?",
    answer:
      "The preview is a watermarked version of your translated document shown inside a protected review page so you can confirm it before purchase.",
  },
  {
    question: "When do I get the clean downloadable file?",
    answer:
      "After payment, the final clean PDF is unlocked for download. If selected, mailed and notarized options can be fulfilled after checkout.",
  },
  {
    question: "What documents can I submit?",
    answer:
      "We handle common personal, academic, legal, and immigration-related documents. If you have something specialized, you can still send it in for review.",
  },
];

const TranslationServices = () => {
  return (
    <div className="bg-slate-50">
      <section className="overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_52%,#f8fafc_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,520px)] lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              New Translation Flow
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Submit your translation for free. Review it first. Pay only when you want the final file.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              CreditEval now lets individuals and businesses place certified translation
              orders with no upfront fee. We translate first, send a secure watermarked
              preview, and let you unlock the clean downloadable version only when you are ready.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                <Link to="/order-wizard?service=translation">
                  Start Free Translation Order
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
                <Link to="/contact">
                  Talk To Our Team
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-950">No upfront payment</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Submit first and approve after reviewing the preview.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-950">Secure online preview</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    View the watermarked translation in a protected review page.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-950">Download or mail options</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Unlock the PDF and add notarization or shipping if needed.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-blue-200/40 via-white to-sky-100 blur-3xl" />
            <div className="relative rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.14)]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 text-white">
                  <div>
                    <p className="text-sm font-semibold">Preview Before Purchase</p>
                    <p className="text-xs text-slate-300">Certified translation review flow</p>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                    Preview Only
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] bg-slate-100 p-4">
                  <div className="mx-auto max-w-md rounded-[20px] border border-slate-300 bg-white shadow-lg">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Certified Translation
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-950">
                            Tax Return Translation
                          </p>
                        </div>
                        <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Portuguese to English
                        </div>
                      </div>
                    </div>

                    <div className="relative px-6 py-8">
                      <div className="space-y-3 text-sm text-slate-500">
                        <div className="h-3 rounded-full bg-slate-200" />
                        <div className="h-3 w-10/12 rounded-full bg-slate-200" />
                        <div className="h-3 w-11/12 rounded-full bg-slate-200" />
                        <div className="h-3 w-8/12 rounded-full bg-slate-200" />
                        <div className="h-3 w-9/12 rounded-full bg-slate-200" />
                        <div className="h-3 w-7/12 rounded-full bg-slate-200" />
                      </div>

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="-rotate-[32deg] text-center text-[32px] font-black uppercase leading-[1.08] tracking-[0.22em] text-slate-950/15 sm:text-[38px]">
                          <div>CreditEval Preview</div>
                          <div>Review Before</div>
                          <div>Final Download</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Customer Sees
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Watermarked preview on the left, price and delivery options on the right.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        After Purchase
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Clean final PDF unlocks for immediate download, with optional mailing and notarization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              A simpler translation offer your customers can trust
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Instead of forcing payment upfront, we lead with confidence. Customers submit
              documents, receive a real translated preview, and only pay when they are satisfied
              and ready to unlock the final clean version.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <Card key={reason.title} className="border-slate-200 bg-slate-50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-950">{reason.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {reason.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_420px]">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                How the new translation process works
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                The flow is designed to remove hesitation for customers while keeping the
                delivery process structured and professional.
              </p>

              <div className="mt-10 space-y-5">
                {processSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <Languages className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">Common documents</h3>
                      <p className="text-sm text-slate-500">We regularly translate documents like:</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {includedDocs.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-slate-950 text-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">What customers receive</h3>
                      <p className="text-sm text-slate-300">A guided review and delivery experience</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                    <div className="flex gap-3">
                      <Eye className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                      <span>Secure preview page with watermarked translation review</span>
                    </div>
                    <div className="flex gap-3">
                      <Mail className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                      <span>Email notification when the preview is ready</span>
                    </div>
                    <div className="flex gap-3">
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                      <span>Immediate clean PDF download after purchase</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700">
                      <Link to="/order-wizard?service=translation">
                        Start Free Translation Order
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Questions about the free preview model?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Here is the short version of how the new offer works.
            </p>
          </div>

          <div className="mt-12 grid gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-slate-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Start the translation now. Approve and unlock it later.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Upload your documents, receive a secure preview, and only pay when you are ready to download the final certified translation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/order-wizard?service=translation">Start Free Translation Order</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-600 bg-transparent text-white hover:bg-slate-800">
              <Link to="/contact">Ask A Question</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TranslationServices;
