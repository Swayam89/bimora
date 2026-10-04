import { LegalPage } from "@/components/landing/LegalPage";
export const metadata = { title: "Privacy · Bimora" };
export default function Privacy() {
  return <LegalPage title="Privacy" sections={[
    ["What this demo stores", "Your onboarding answers are saved only in this browser (local storage) so Bimora can continue the conversation. Nothing is sent to a server. Uploaded files are not read or transmitted; the document analysis shown is a sample."],
    ["Analytics", "Product events (for example, “recommendation viewed”) are recorded without names, phone numbers, health details, income or document contents."],
    ["In the live product", "[To be supplied: data controller, purposes, retention, health-data consent, sharing with insurers, user rights and grievance officer contact.]"],
  ]} />;
}
