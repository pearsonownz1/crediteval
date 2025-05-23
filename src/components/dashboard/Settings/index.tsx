import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const SettingsView: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center py-12 text-gray-500">
          Settings interface will be implemented in the future.
        </p>
      </CardContent>
    </Card>
  );
};
