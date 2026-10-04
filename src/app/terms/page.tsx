import { LegalPage } from "@/components/landing/LegalPage";
export const metadata = { title: "Terms · Bimora" };
export default function Terms() {
  return <LegalPage title="Terms" sections={[
    ["About this demo", "Bimora is a product concept. Plans, prices, policy summaries, payments and issuance results shown here are simulated and are not offers, quotes or contracts from any insurer."],
    ["Advice", "Recommendations depend on the information available and do not replace reading the policy wording. Bimora does not give medical advice."],
    ["In the live product", "[To be supplied: intermediary registration, scope of advice, liability, complaints and grievance redressal, governing law.]"],
  ]} />;
}
