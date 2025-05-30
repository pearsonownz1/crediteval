import React from "react";
import { SOCIAL_PROOF_ITEMS } from "../../../constants/order/socialProof";

export const SocialProofSection: React.FC = () => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-center md:text-left">
        Why Choose CreditEval?
      </h3>
      {SOCIAL_PROOF_ITEMS.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg mt-4">
          <item.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-medium">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.text}</p>
          </div>
        </div>
      ))}

      {/* Trust Logos */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-center text-sm font-medium text-muted-foreground mb-4">
          Trusted & Accredited
        </h4>
        <div className="flex justify-center items-center space-x-4">
          <img src="/ata-logo.png" alt="ATA Member" className="h-10" />
          <img
            src="/bbb-accredited.png"
            alt="BBB Accredited Business"
            className="h-10"
          />
          <img src="/trustpilot-logo.png" alt="Trustpilot" className="h-8" />
        </div>
      </div>
    </div>
  );
};
