import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Assuming accordion is in ui folder

const FAQPage = () => {
  const faqs = [
    // Credential Evaluation FAQs
    {
      category: "Credential Evaluation",
      questions: [
        {
          q: "What is a credential evaluation?",
          a: "A credential evaluation is a service that compares academic and professional degrees earned in one country to the standards of another country. It helps institutions like universities, employers, and licensing boards understand foreign education.",
        },
        {
          q: "Why do I need a credential evaluation?",
          a: "You typically need an evaluation for purposes such as applying for higher education, professional licensure, employment, or immigration in a country different from where you earned your credentials.",
        },
        {
          q: "What types of evaluations do you offer?",
          a: "We offer various types of evaluations, including Document-by-Document evaluations (listing credentials and equivalents) and Course-by-Course evaluations (listing courses, grades, credits, and GPA). The type needed depends on the requesting institution's requirements.",
        },
        {
          q: "What documents do I need to submit?",
          a: "Generally, you need to submit official copies of your academic transcripts, diplomas, or certificates. Specific requirements may vary depending on the country of education and the purpose of the evaluation. We will provide detailed instructions when you place an order.",
        },
        {
          q: "How long does an evaluation take?",
          a: "Standard turnaround time is typically X-Y business days after all required documents are received. Rush services are available for an additional fee. Please check our Pricing page for current turnaround times.",
        },
      ],
    },
    // Certified Translation FAQs
    {
      category: "Certified Translation",
      questions: [
        {
          q: "What is a certified translation?",
          a: "A certified translation is a translation accompanied by a signed statement from the translator or translation agency attesting to the accuracy and completeness of the translation. It is often required for official documents submitted to government agencies, universities, and legal entities.",
        },
        {
          q: "When do I need a certified translation?",
          a: "Certified translations are commonly required for documents such as birth certificates, marriage certificates, academic transcripts, diplomas, legal contracts, and immigration paperwork when submitting them to official bodies in a different language.",
        },
        {
          q: "What languages do you translate?",
          a: "We offer certified translations for a wide range of languages. Please visit our Translation Services page or contact us for specific language pair availability.",
        },
        {
          q: "How is the cost of translation determined?",
          a: "Translation costs are typically based on the number of pages or words, the language pair, the complexity of the document, and the required turnaround time. You can request a free quote through our website.",
        },
        {
          q: "Is your certified translation accepted by USCIS?",
          a: "Yes, our certified translations meet the requirements set forth by the United States Citizenship and Immigration Services (USCIS) and other official institutions.",
        },
      ],
    },
    // General FAQs
    {
      category: "General",
      questions: [
        {
          q: "How do I place an order?",
          a: "You can place an order directly through our website. Select the service you need (evaluation or translation), upload your documents, and complete the payment process. Our team will guide you through the next steps.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept major credit cards (Visa, MasterCard, American Express, Discover) and potentially other payment methods as indicated during checkout.",
        },
        {
          q: "How will I receive my completed evaluation or translation?",
          a: "Completed evaluations and translations are typically delivered electronically via email in PDF format. Physical copies can be mailed upon request for an additional shipping fee.",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>

      {faqs.map((categorySection) => (
        <div key={categorySection.category} className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-2">{categorySection.category}</h2>
          <Accordion type="single" collapsible className="w-full">
            {categorySection.questions.map((faq, index) => (
              <AccordionItem value={`item-${categorySection.category}-${index}`} key={index}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
};

export default FAQPage;
